import { HttpClient } from '@actions/http-client';

export interface DownloadInfo {
  archiveUrl: string;
  fileToExtract: string;
}

export async function getDownloadInfo(version: string, platform: string, arch: string): Promise<DownloadInfo> {
  const infoUrl = `https://temporal.download/cli/${version}?platform=${platform}&arch=${arch}`;
  const httpClient = new HttpClient('setup-temporal-github-action');
  const res = await httpClient.getJson<DownloadInfo>(infoUrl);
  if (res.statusCode === 200 && res.result) {
    return res.result;
  }
  throw new Error(`Failed to get download info: ${res.statusCode}`);
}
