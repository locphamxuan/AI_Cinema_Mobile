import { barRatio, seekTarget } from '../lib/seek';

describe('seeking the player', () => {
  it('never hands the video a non-finite time (web throws on it)', () => {
    expect(seekTarget(NaN, 1400)).toBeNull();
    expect(seekTarget(Infinity, 1400)).toBeNull();
  });

  it('stays inside the episode, or only above zero while its length is unknown', () => {
    expect(seekTarget(-5, 1400)).toBe(0);
    expect(seekTarget(1500, 1400)).toBe(1400);
    expect(seekTarget(130, 0)).toBe(130);
    expect(seekTarget(130, NaN)).toBe(130);
  });

  it('reads where the seek bar was pressed, or nothing when the press has no position', () => {
    expect(barRatio(50, 200)).toBe(0.25);
    expect(barRatio(250, 200)).toBe(1);
    expect(barRatio(undefined as unknown as number, 200)).toBeNull();
    expect(barRatio(50, 0)).toBeNull();
  });
});
