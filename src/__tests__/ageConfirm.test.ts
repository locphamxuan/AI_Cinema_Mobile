import { calculateAgeYears, isAtLeast18 } from '../lib/authForm';

describe('age confirmation helpers (BR-54)', () => {
  const refDate = new Date(2026, 10, 10); // 2026-11-10

  it('computes exact completed years around birthday boundary', () => {
    expect(calculateAgeYears('2008-11-10', refDate)).toBe(18);
    expect(calculateAgeYears('2008-11-11', refDate)).toBe(17);
    expect(calculateAgeYears('2000-02-29', refDate)).toBe(26);
  });

  it('rejects invalid calendar dates and malformed strings', () => {
    expect(calculateAgeYears('', refDate)).toBeNull();
    expect(calculateAgeYears('10/11/2000', refDate)).toBeNull();
    expect(calculateAgeYears('2001-02-29', refDate)).toBeNull();
    expect(calculateAgeYears('2026-02-30', refDate)).toBeNull();
    expect(calculateAgeYears('2028-01-01', refDate)).toBeNull();
  });

  it('enforces 18+ eligibility accurately', () => {
    expect(isAtLeast18('2008-11-10', refDate)).toBe(true);
    expect(isAtLeast18('2008-11-11', refDate)).toBe(false);
    expect(isAtLeast18('2012-05-01', refDate)).toBe(false);
    expect(isAtLeast18('invalid-date', refDate)).toBe(false);
  });
});
