export function assetUrl(name: string): string {
  const hostPath = (window as Window & { __PLAYABLE_PUBLIC_PATH__?: string }).__PLAYABLE_PUBLIC_PATH__;
  if (hostPath) {
    const normalized = hostPath.endsWith('/') ? hostPath : `${hostPath}/`;
    return `${normalized}assets/${name}`;
  }

  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}assets/${name}`;
}
