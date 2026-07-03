"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDownloadInfo = void 0;
async function getDownloadInfo(version, platform, arch) {
    const infoUrl = `https://temporal.download/cli/${version}?platform=${platform}&arch=${arch}`;
    const res = await fetch(infoUrl, {
        headers: {
            'user-agent': 'setup-temporal-github-action',
        },
    });
    if (!res.ok) {
        throw new Error(`Failed to get download info: ${res.status}`);
    }
    const result = await res.json();
    if (isDownloadInfo(result)) {
        return result;
    }
    throw new Error('Failed to get download info: response was missing archiveUrl or fileToExtract');
}
exports.getDownloadInfo = getDownloadInfo;
function isDownloadInfo(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const candidate = value;
    return typeof candidate.archiveUrl === 'string' && typeof candidate.fileToExtract === 'string';
}
//# sourceMappingURL=download-info.js.map