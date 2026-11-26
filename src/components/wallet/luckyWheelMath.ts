import type { RewardPrize } from '../../types/episodeAccess';

/** Full turns the wheel makes before it settles on the prize. */
export const SPIN_TURNS = 5;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Degrees one segment takes; segment `i` is centred at `i * segmentAngle` clockwise from the top. */
export const segmentAngle = (count: number) => 360 / Math.max(count, 1);

/**
 * The rotation (degrees, clockwise) the wheel must end on so segment `index` sits under the
 * pointer at the top, at least `turns` full turns past `current`. `offset` (-0.5..0.5 of a
 * segment) keeps the stop from always landing dead centre while staying inside the segment.
 */
export function landingRotation(current: number, index: number, count: number, turns = SPIN_TURNS, offset = 0): number {
  const seg = segmentAngle(count);
  const safeOffset = Math.max(-0.35, Math.min(0.35, offset));
  const target = mod(-(index + safeOffset) * seg, 360);
  return current + turns * 360 + mod(target - mod(current, 360), 360);
}

/** The segment under the top pointer once the wheel has turned `rotation` degrees. */
export function segmentAtPointer(rotation: number, count: number): number {
  const seg = segmentAngle(count);
  return mod(Math.round(mod(-rotation, 360) / seg), count);
}

/** Short text written on a segment: "50 Coin", "30 ngày". The full name is listed under the wheel. */
export const segmentLabel = (prize: Pick<RewardPrize, 'type' | 'bonusCoins' | 'planDays'>) =>
  prize.type === 'BONUS_COIN' ? `${prize.bonusCoins} Coin` : `${prize.planDays} ngày`;

/**
 * Colour index of each segment out of `paletteSize` colours, so that no two neighbours match,
 * including the last segment and the first one, which touch.
 */
export function segmentColorIndexes(count: number, paletteSize: number): number[] {
  const indexes = Array.from({ length: count }, (_, i) => i % paletteSize);
  if (count > 2 && paletteSize > 2 && indexes[count - 1] === indexes[0]) {
    indexes[count - 1] = indexes[count - 2] === 1 ? 2 : 1;
  }
  return indexes;
}

/** Width of the brass rim around the disc, where the bulbs sit. */
export const WHEEL_RIM = 14;
/** How far the pointer stands above the rim, so it is drawn inside the wheel's own box. */
export const POINTER_OVERHANG = 8;
/** Average width of a bold glyph, as a share of the font size (digits and Vietnamese letters). */
const GLYPH_WIDTH = 0.62;

/** The font size that fits `text` on one line in a `length` x `height` label box: 9 to 14 points. */
export function labelFontSize(text: string, length: number, height: number): number {
  const byHeight = height * 0.62;
  const byLength = length / (Math.max(text.length, 1) * GLYPH_WIDTH);
  return Math.max(9, Math.min(14, byHeight, byLength));
}

/**
 * Sizes of a wheel `size` points wide with `count` segments: the disc inside the rim, each label box
 * (along the radius, from just inside the rim to before the hub, as tall as the segment allows) and
 * the centre button with a font that keeps "Quay" inside it.
 */
export function wheelLayout(size: number, count: number) {
  const disc = size - WHEEL_RIM * 2;
  const r = disc / 2;
  const seg = segmentAngle(count);
  const hub = Math.max(64, disc * 0.27);
  const labelStart = 10;
  // Ends 6 points before the hub so the longest label never runs under the button.
  const labelLength = Math.min(r * 0.58, r - hub / 2 - labelStart - 6);
  // The width of the segment half way along the label; one segment alone has the whole disc.
  const middle = r - labelStart - labelLength / 2;
  const arc = count <= 1 ? disc : 2 * middle * Math.sin(Math.min(seg, 180) * (Math.PI / 360));
  const labelHeight = Math.max(12, Math.min(28, arc * 0.6));
  // The face inside the 4-point border; "Quay" (4 letters, wide display font) takes about 0.7 of it.
  const hubFont = Math.max(14, Math.min(20, (hub - 8) * 0.3));
  return { disc, r, seg, hub, hubFont, labelStart, labelLength, labelHeight };
}
