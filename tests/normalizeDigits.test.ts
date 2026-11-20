import { normalizeDigits } from '../src/lib/validation/ppdb';
import { describe, expect, it } from 'bun:test';

describe('normalizeDigits', () => {
  it('strips spaces and dashes', () => {
    expect(normalizeDigits('007 1234 567')).toBe('0071234567');
    expect(normalizeDigits('007-123-4567')).toBe('0071234567');
  });
  it('converts full-width digits', () => {
    expect(normalizeDigits('００７１２３４５６７')).toBe('0071234567');
  });
  it('keeps valid 10-digit as-is', () => {
    expect(normalizeDigits('0071234567')).toBe('0071234567');
  });
  it('handles empty', () => {
    expect(normalizeDigits('')).toBe('');
  });
});
