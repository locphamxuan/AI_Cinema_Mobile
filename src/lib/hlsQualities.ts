/** One rendition of an HLS master playlist: `720p` → its media playlist URL. */
export interface HlsRendition {
  label: string;
  height: number;
  url: string;
}

const LABEL_IN_URI = /(?:^|\/)(\d{3,4})p(?:\/|$)/;

/**
 * The renditions of a master playlist, highest first. The label comes from the rendition folder
 * (`720p/index.m3u8`, how the BE names them) or else from RESOLUTION; relative URIs resolve against the
 * master URL so the signed query string of each line is kept as the BE wrote it.
 */
export function parseMasterPlaylist(text: string, masterUrl: string): HlsRendition[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const out: HlsRendition[] = [];
  lines.forEach((line, i) => {
    if (!line.startsWith('#EXT-X-STREAM-INF')) return;
    const uri = lines.slice(i + 1).find((l) => l && !l.startsWith('#'));
    if (!uri) return;
    const path = uri.split('?')[0];
    const fromUri = LABEL_IN_URI.exec(path)?.[1];
    const fromRes = /RESOLUTION=\d+x(\d+)/.exec(line)?.[1];
    const height = Number(fromUri ?? fromRes ?? 0);
    if (!height) return;
    let url: string;
    try {
      url = new URL(uri, masterUrl).toString();
    } catch {
      return;
    }
    if (!out.some((r) => r.height === height)) out.push({ label: `${height}p`, height, url });
  });
  return out.sort((a, b) => b.height - a.height);
}

/** The stream to load for a room quality: the master for `auto`, else the closest rendition at or below it. */
export function streamUrlFor(quality: string, renditions: HlsRendition[], masterUrl: string): string {
  if (quality === 'auto' || renditions.length === 0) return masterUrl;
  const wanted = Number(quality.replace('p', ''));
  const pick = renditions.find((r) => r.height <= wanted) ?? renditions[renditions.length - 1];
  return pick.url;
}
