const HLS_URL = /\.m3u8(\?|$)/i;

/** Chrome and Edge cannot play an HLS playlist from a <video> src, so hls.js feeds it there; Safari can. */
export function attachWebStream(host: unknown, url: string): () => void {
  const video = (host as HTMLElement | null)?.querySelector?.('video');
  if (!video || !HLS_URL.test(url) || video.canPlayType('application/vnd.apple.mpegurl')) return () => undefined;
  let hls: { destroy: () => void } | null = null;
  let closed = false;
  void import('hls.js').then(({ default: Hls }) => {
    if (closed || !Hls.isSupported()) return;
    const engine = new Hls();
    hls = engine;
    engine.loadSource(url);
    engine.attachMedia(video);
    engine.on(Hls.Events.MANIFEST_PARSED, () => void video.play().catch(() => undefined));
  });
  return () => {
    closed = true;
    hls?.destroy();
  };
}

export function toggleWebFullscreen(host: unknown): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void (host as HTMLElement | null)?.requestFullscreen?.();
}

/** Esc leaves fullscreen without touching the player's button, so the state follows the browser. */
export function watchWebFullscreen(host: unknown, onChange: (fullscreen: boolean) => void): () => void {
  const update = () => onChange(document.fullscreenElement === host);
  document.addEventListener('fullscreenchange', update);
  return () => document.removeEventListener('fullscreenchange', update);
}
