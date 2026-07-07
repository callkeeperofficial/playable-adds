export function assetsBase(): string {
  const hostPath = (window as Window & { __PLAYABLE_PUBLIC_PATH__?: string }).__PLAYABLE_PUBLIC_PATH__;
  if (hostPath) {
    const normalized = hostPath.endsWith('/') ? hostPath : `${hostPath}/`;
    return normalized.endsWith('assets/') ? normalized : `${normalized}assets/`;
  }

  return new URL('./', import.meta.url).href;
}

export function assetUrl(name: string): string {
  return `${assetsBase()}${name}`;
}
