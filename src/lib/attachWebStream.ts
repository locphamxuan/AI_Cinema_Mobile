/** Phones play HLS and go fullscreen natively; only the web build needs help (see attachWebStream.web.ts). */
export function attachWebStream(_host: unknown, _url: string): () => void {
  return () => undefined;
}

export function toggleWebFullscreen(_host: unknown): void {}

export function watchWebFullscreen(_host: unknown, _onChange: (fullscreen: boolean) => void): () => void {
  return () => undefined;
}
