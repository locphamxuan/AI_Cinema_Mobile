/** One subtitle line on screen between `start` and `end` (seconds). */
export interface Cue {
  start: number;
  end: number;
  text: string;
}

const TIME = /(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{3})/;

function seconds(stamp: string): number {
  const m = TIME.exec(stamp);
  if (!m) return NaN;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
}

/** Reads WebVTT (or SubRip) into cues sorted by start time; tags such as <i> are dropped. */
export function parseVtt(text: string): Cue[] {
  const blocks = text.replace(/^\uFEFF/, '').replace(/\r/g, '').split(/\n\n+/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const at = lines.findIndex((line) => line.includes('-->'));
    if (at < 0) continue;
    const [from, to] = lines[at].split('-->');
    const start = seconds(from);
    const end = seconds(to);
    const body = lines.slice(at + 1).join('\n').replace(/<[^>]+>/g, '').trim();
    if (Number.isFinite(start) && Number.isFinite(end) && body) cues.push({ start, end, text: body });
  }
  return cues.sort((a, b) => a.start - b.start);
}

/** The text shown at `time`, or null between lines. */
export function cueAt(cues: Cue[], time: number): string | null {
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].end <= time) lo = mid + 1;
    else if (cues[mid].start > time) hi = mid - 1;
    else return cues[mid].text;
  }
  return null;
}

/** 75 -> "1:15", 3725 -> "1:02:05". */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600);
  return h ? `${h}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : `${Math.floor(s / 60)}:${pad(s % 60)}`;
}