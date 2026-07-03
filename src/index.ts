import { execFile } from 'child_process';
import { access, appendFile, chmod, mkdtemp, readdir, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { getDownloadInfo } from './download-info';

const execFileAsync = promisify(execFile);

function parseVersion(version: string): string {
  const matchDetails = version.match(/^[v]?(\d+)(?:\.(\d+)(?:\.(\d+))?)?((?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/);
  if (matchDetails) {
    const major = matchDetails[1];
    const minor = matchDetails[2] || '0';
    const patch = matchDetails[3] || '0';
    const suffix = matchDetails[4] || '';
    return `v${major}.${minor}.${patch}${suffix}`;
  }
  if (version === 'latest') {
    return 'latest';
  }
  throw new Error(`Invalid version: '${version}'`);
}

function getCurrentArch(): string {
  const arch = os.arch() as NodeJS.Architecture;
  switch (arch) {
    case 'arm64':
      return 'arm64';
    case 'x64':
      return 'amd64';
    default:
      throw new Error(`Unsupported architecture: '${arch}'`);
  }
}

function getCurrentPlatform(): string {
  const platform = os.platform();
  switch (platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'darwin';
    case 'linux':
      return 'linux';
    default:
      throw new Error(`Unsupported platform: '${platform}'`);
  }
}

function getInput(name: string): string {
  const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  return (process.env[envVar] || '').trim();
}

async function addPath(pathToAdd: string): Promise<void> {
  const githubPath = process.env.GITHUB_PATH;

  if (githubPath) {
    await appendFile(githubPath, `${pathToAdd}${os.EOL}`);
    return;
  }

  process.env.PATH = [pathToAdd, process.env.PATH].filter(Boolean).join(path.delimiter);
}

async function downloadTool(archiveUrl: string): Promise<string> {
  const response = await fetch(archiveUrl);
  if (!response.ok) {
    throw new Error(`Failed to download Temporal CLI: ${response.status}`);
  }

  const downloadDir = await mkdtemp(path.join(os.tmpdir(), 'setup-temporal-download-'));
  const archiveName = path.basename(new URL(archiveUrl).pathname) || 'temporal-cli-archive';
  const archivePath = path.join(downloadDir, archiveName);
  const contents = Buffer.from(await response.arrayBuffer());

  await writeFile(archivePath, contents);
  return archivePath;
}

async function extractArchive(archivePath: string, archiveUrl: string): Promise<string> {
  const destination = await mkdtemp(path.join(os.tmpdir(), 'setup-temporal-cli-'));
  const archivePathname = new URL(archiveUrl).pathname;

  if (archivePathname.endsWith('.zip')) {
    if (os.platform() === 'win32') {
      await runCommand('powershell', [
        '-NoLogo',
        '-NoProfile',
        '-Command',
        'Expand-Archive',
        '-LiteralPath',
        archivePath,
        '-DestinationPath',
        destination,
        '-Force',
      ]);
    } else {
      await runCommand('unzip', ['-q', archivePath, '-d', destination]);
    }
  } else {
    await runCommand('tar', ['-xzf', archivePath, '-C', destination]);
  }

  return destination;
}

async function runCommand(command: string, args: string[]): Promise<void> {
  try {
    await execFileAsync(command, args, { windowsHide: true });
  } catch (e) {
    const error = e as { message?: string; stderr?: string };
    const detail = error.stderr?.trim() || error.message || 'unknown error';
    throw new Error(`Failed to run ${command}: ${detail}`);
  }
}

function resolveInside(baseDir: string, relativePath: string): string {
  const resolved = path.resolve(baseDir, relativePath);
  const relative = path.relative(baseDir, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Invalid file path in download metadata: ${relativePath}`);
  }

  return resolved;
}

async function findTemporalBinary(rootDir: string, platform: string): Promise<string | undefined> {
  const expectedName = platform === 'windows' ? 'temporal.exe' : 'temporal';
  const entries = await readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isFile() && entry.name === expectedName) {
      return entryPath;
    }

    if (entry.isDirectory()) {
      const nested = await findTemporalBinary(entryPath, platform);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

async function getCliPath(extractDir: string, fileToExtract: string, platform: string): Promise<string> {
  const metadataPath = resolveInside(extractDir, fileToExtract);

  try {
    await access(metadataPath);
    return metadataPath;
  } catch {
    const discoveredPath = await findTemporalBinary(extractDir, platform);
    if (discoveredPath) {
      return discoveredPath;
    }

    throw new Error(`Unable to find Temporal CLI in extracted archive: ${fileToExtract}`);
  }
}

async function run() {
  try {
    const version = parseVersion(getInput('version') || 'latest');
    const platform = getCurrentPlatform();
    const arch = getCurrentArch();

    const downloadInfo = await getDownloadInfo(version, platform, arch);
    const archivePath = await downloadTool(downloadInfo.archiveUrl);
    const extractDir = await extractArchive(archivePath, downloadInfo.archiveUrl);
    const cliPath = await getCliPath(extractDir, downloadInfo.fileToExtract, platform);

    if (platform !== 'windows') {
      await chmod(cliPath, 0o755);
    }

    await addPath(path.dirname(cliPath));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    process.stderr.write(`${message}${os.EOL}`);
    process.exitCode = 1;
  }
}

run();
