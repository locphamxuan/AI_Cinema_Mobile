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
