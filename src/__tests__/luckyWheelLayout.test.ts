import { labelFontSize, POINTER_OVERHANG, segmentLabel, WHEEL_RIM, wheelLayout } from '../components/wallet/luckyWheelMath';

// RewardSpinModal draws the wheel min(screen width - 48, 320) wide: a 320-point phone up to a large one.
const sizes = [232, 272, 320];
const GLYPH = 0.62;

describe('lucky wheel layout (BR-09)', () => {
  it.each(sizes)('keeps every label between the rim and the hub on a %i-point wheel', (size) => {
    for (const count of [2, 3, 6, 8, 12]) {
      const { disc, r, hub, labelStart, labelLength } = wheelLayout(size, count);
      expect(disc).toBe(size - WHEEL_RIM * 2);
      expect(labelStart).toBeGreaterThan(0);
      // The label ends before the centre button starts.
      expect(labelStart + labelLength).toBeLessThan(r - hub / 2);
      expect(labelLength).toBeGreaterThan(40);
    }
  });

  it.each(sizes)('keeps each label box inside its own segment on a %i-point wheel', (size) => {
    for (const count of [3, 6, 8, 12, 16]) {
      const { r, seg, labelStart, labelLength, labelHeight } = wheelLayout(size, count);
      // The narrowest point of the label is its inner end; the box may not be wider than the segment there.
      const inner = r - labelStart - labelLength;
      const widthThere = 2 * inner * Math.sin((seg * Math.PI) / 360);
      expect(labelHeight).toBeLessThanOrEqual(Math.max(12, widthThere * 1.25));
    }
  });

  it('fits the longest prize names on one line instead of clipping them', () => {
    for (const size of sizes) {
      const { labelLength, labelHeight } = wheelLayout(size, 8);
      for (const text of [segmentLabel({ type: 'BONUS_COIN', bonusCoins: 5, planDays: null }), '1000 Coin', '30 ngày']) {
        const font = labelFontSize(text, labelLength, labelHeight);
        expect(font).toBeGreaterThanOrEqual(9);
        expect(font).toBeLessThanOrEqual(14);
        if (font > 9) expect(text.length * GLYPH * font).toBeLessThanOrEqual(labelLength + 0.01);
        expect(font).toBeLessThanOrEqual(labelHeight * 0.62 + 0.01);
      }
    }
  });

  it('keeps "Quay" inside the centre button on every size', () => {
    for (const size of sizes) {
      const { hub, hubFont } = wheelLayout(size, 6);
      expect(hub).toBeGreaterThanOrEqual(64);
      expect(hubFont).toBeGreaterThanOrEqual(14);
      expect(hubFont).toBeLessThanOrEqual(20);
      // Four wide letters with spacing take about 0.7 of a font size each, inside the 4-point border.
      expect(4 * 0.7 * hubFont + 4).toBeLessThanOrEqual(hub - 8);
    }
  });

  it('gives one segment the whole disc and leaves room for the pointer above the rim', () => {
    const one = wheelLayout(272, 1);
    expect(one.seg).toBe(360);
    expect(one.labelHeight).toBe(28);
    expect(POINTER_OVERHANG).toBeGreaterThan(0);
    // The 28-point pointer reaches past the rim into the disc, so it points at a segment, not at the bulbs.
    expect(28 - POINTER_OVERHANG).toBeGreaterThan(WHEEL_RIM);
  });
});
