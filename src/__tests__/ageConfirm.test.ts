import { authFormError, calculateAgeYears, formatDobDisplay, isAtLeast18, normalizeDateOfBirth } from '../lib/authForm';

describe('age confirmation helpers (BR-54)', () => {
  const refDate = new Date(2026, 10, 10); // 2026-11-10

  it('normalizes both YYYY-MM-DD and Vietnamese DD/MM/YYYY formats', () => {
    expect(normalizeDateOfBirth('2003-05-14')).toBe('2003-05-14');
    expect(normalizeDateOfBirth('14/05/2003')).toBe('2003-05-14');
    expect(normalizeDateOfBirth('14-5-2003')).toBe('2003-05-14');
    expect(normalizeDateOfBirth('Phuoc')).toBeNull();
    expect(normalizeDateOfBirth('2026-02-30')).toBeNull();
    expect(formatDobDisplay('2003-05-14')).toBe('14/05/2003');
  });

  it('computes exact completed years around birthday boundary', () => {
    expect(calculateAgeYears('2008-11-10', refDate)).toBe(18);
    expect(calculateAgeYears('10/11/2008', refDate)).toBe(18);
    expect(calculateAgeYears('2008-11-11', refDate)).toBe(17);
    expect(calculateAgeYears('2000-02-29', refDate)).toBe(26);
  });

  it('rejects invalid calendar dates and malformed strings', () => {
    expect(calculateAgeYears('', refDate)).toBeNull();
    expect(calculateAgeYears('Phuoc', refDate)).toBeNull();
    expect(calculateAgeYears('2001-02-29', refDate)).toBeNull();
    expect(calculateAgeYears('2026-02-30', refDate)).toBeNull();
    expect(calculateAgeYears('2028-01-01', refDate)).toBeNull();
  });

  it('enforces 18+ eligibility accurately', () => {
    expect(isAtLeast18('2008-11-10', refDate)).toBe(true);
    expect(isAtLeast18('10/11/2008', refDate)).toBe(true);
    expect(isAtLeast18('2008-11-11', refDate)).toBe(false);
    expect(isAtLeast18('2012-05-01', refDate)).toBe(false);
    expect(isAtLeast18('invalid-date', refDate)).toBe(false);
  });

  it('blocks malformed text or underage dates in authFormError before opening modal', () => {
    const base = { name: 'Phước', email: 'phuoc@mail.com', password: 'Secret123', confirmPassword: 'Secret123' };
    expect(authFormError(false, { ...base, dateOfBirth: 'Phuoc' })).toContain('DD/MM/YYYY');
    expect(authFormError(false, { ...base, dateOfBirth: '14/05/2015' })).toContain('18 tuổi');
    expect(authFormError(false, { ...base, dateOfBirth: '14/05/2003' })).toBeNull();
  });
});
