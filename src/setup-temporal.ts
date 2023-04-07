import os from 'os';
import * as actionsCore from '@actions/core';
import * as toolCache from '@actions/tool-cache';
import { getDownloadInfo } from './download-info';

function parseVersion(version: string): string {
  const matchDetails = version.match(/^[v]?(\d+)(?:\.(\d+)(?:\.(\d+))?)?$/);
  if (matchDetails) {
    const major = matchDetails[1];
    const minor = matchDetails[2] || '0';
    const patch = matchDetails[3] || '0';
    return `v${major}.${minor}.${patch}`;
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

async function run() {
  try {
    // Get version of tool to be installed
    const version = parseVersion(actionsCore.getInput('version'));
    const platform = getCurrentPlatform();
    const arch = getCurrentArch();

    // Download the specific version of the tool, e.g. as a tarball/zipball
    const downloadInfo = await getDownloadInfo(version, platform, arch);
    const pathToTarball = await toolCache.downloadTool(downloadInfo.archiveUrl);

    // Extract the tarball/zipball onto host runner
    const extract = downloadInfo.archiveUrl.endsWith('.zip') ? toolCache.extractZip : toolCache.extractTar;
    const pathToCLI = await extract(pathToTarball);

    // Expose the tool by adding it to the PATH
    actionsCore.addPath(pathToCLI);
  } catch (e) {
    actionsCore.setFailed((e as Error).message);
  }
}

run();
