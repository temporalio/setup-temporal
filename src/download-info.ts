export interface DownloadInfo {
  archiveUrl: string;
  fileToExtract: string;
}

export async function getDownloadInfo(version: string, platform: string, arch: string): Promise<DownloadInfo> {
  const infoUrl = `https://temporal.download/cli/${version}?platform=${platform}&arch=${arch}`;

  const res = await fetch(infoUrl, {
    headers: {
      'user-agent': 'setup-temporal-github-action',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get download info: ${res.status}`);
  }

  const result: unknown = await res.json();
  if (isDownloadInfo(result)) {
    return result;
  }

  throw new Error('Failed to get download info: response was missing archiveUrl or fileToExtract');
}

function isDownloadInfo(value: unknown): value is DownloadInfo {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.archiveUrl === 'string' && typeof candidate.fileToExtract === 'string';
}
