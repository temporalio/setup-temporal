export interface Info {
  archiveUrl: string;
  fileToExtract: string;
}

export async function getDownloadInfo(version: string, platform: string, arch: string): Promise<Info> {
  const infoUrl = `https://temporal.download/cli/${version}?platform=${platform}&arch=${arch}`;
  const infoRes = await fetch(infoUrl);

  if (infoRes.ok) return (await infoRes.json()) as Info;

  throw new Error(`Failed to get download info: ${infoRes.statusText}`);
}
