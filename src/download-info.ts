import { got } from 'got';

export interface DownloadInfo {
  archiveUrl: string;
  fileToExtract: string;
}

export async function getDownloadInfo(version: string, platform: string, arch: string): Promise<DownloadInfo> {
  try {
    const infoUrl = `https://temporal.download/cli/${version}?platform=${platform}&arch=${arch}`;
    return await got(infoUrl).json<DownloadInfo>();
  } catch (e) {
    throw new Error(`Failed to get download info: ${e}`);
  }
}
