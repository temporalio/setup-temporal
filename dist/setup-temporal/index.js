"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const download_info_1 = require("./download-info");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
function parseVersion(version) {
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
function getCurrentArch() {
    const arch = os_1.default.arch();
    switch (arch) {
        case 'arm64':
            return 'arm64';
        case 'x64':
            return 'amd64';
        default:
            throw new Error(`Unsupported architecture: '${arch}'`);
    }
}
function getCurrentPlatform() {
    const platform = os_1.default.platform();
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
function getInput(name) {
    const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
    return (process.env[envVar] || '').trim();
}
async function addPath(pathToAdd) {
    const githubPath = process.env.GITHUB_PATH;
    if (githubPath) {
        await (0, promises_1.appendFile)(githubPath, `${pathToAdd}${os_1.default.EOL}`);
        return;
    }
    process.env.PATH = [pathToAdd, process.env.PATH].filter(Boolean).join(path_1.default.delimiter);
}
async function downloadTool(archiveUrl) {
    const response = await fetch(archiveUrl);
    if (!response.ok) {
        throw new Error(`Failed to download Temporal CLI: ${response.status}`);
    }
    const downloadDir = await (0, promises_1.mkdtemp)(path_1.default.join(os_1.default.tmpdir(), 'setup-temporal-download-'));
    const archiveName = path_1.default.basename(new URL(archiveUrl).pathname) || 'temporal-cli-archive';
    const archivePath = path_1.default.join(downloadDir, archiveName);
    const contents = Buffer.from(await response.arrayBuffer());
    await (0, promises_1.writeFile)(archivePath, contents);
    return archivePath;
}
async function extractArchive(archivePath, archiveUrl) {
    const destination = await (0, promises_1.mkdtemp)(path_1.default.join(os_1.default.tmpdir(), 'setup-temporal-cli-'));
    const archivePathname = new URL(archiveUrl).pathname;
    if (archivePathname.endsWith('.zip')) {
        if (os_1.default.platform() === 'win32') {
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
        }
        else {
            await runCommand('unzip', ['-q', archivePath, '-d', destination]);
        }
    }
    else {
        await runCommand('tar', ['-xzf', archivePath, '-C', destination]);
    }
    return destination;
}
async function runCommand(command, args) {
    try {
        await execFileAsync(command, args, { windowsHide: true });
    }
    catch (e) {
        const error = e;
        const detail = error.stderr?.trim() || error.message || 'unknown error';
        throw new Error(`Failed to run ${command}: ${detail}`);
    }
}
function resolveInside(baseDir, relativePath) {
    const resolved = path_1.default.resolve(baseDir, relativePath);
    const relative = path_1.default.relative(baseDir, resolved);
    if (relative.startsWith('..') || path_1.default.isAbsolute(relative)) {
        throw new Error(`Invalid file path in download metadata: ${relativePath}`);
    }
    return resolved;
}
async function findTemporalBinary(rootDir, platform) {
    const expectedName = platform === 'windows' ? 'temporal.exe' : 'temporal';
    const entries = await (0, promises_1.readdir)(rootDir, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path_1.default.join(rootDir, entry.name);
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
async function getCliPath(extractDir, fileToExtract, platform) {
    const metadataPath = resolveInside(extractDir, fileToExtract);
    try {
        await (0, promises_1.access)(metadataPath);
        return metadataPath;
    }
    catch {
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
        const downloadInfo = await (0, download_info_1.getDownloadInfo)(version, platform, arch);
        const archivePath = await downloadTool(downloadInfo.archiveUrl);
        const extractDir = await extractArchive(archivePath, downloadInfo.archiveUrl);
        const cliPath = await getCliPath(extractDir, downloadInfo.fileToExtract, platform);
        if (platform !== 'windows') {
            await (0, promises_1.chmod)(cliPath, 0o755);
        }
        await addPath(path_1.default.dirname(cliPath));
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        process.stderr.write(`${message}${os_1.default.EOL}`);
        process.exitCode = 1;
    }
}
run();
//# sourceMappingURL=index.js.map