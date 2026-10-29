import { describe, it, expect } from 'vitest';
import { formatPhoneNumber, getCleanCallNumber } from '../format-phone';

describe('formatPhoneNumber Utility', () => {
  it('formats standard 12-digit Indonesian mobile numbers', () => {
    expect(formatPhoneNumber('081234567890')).toBe('0812-3456-7890');
  });

  it('normalizes international format (+62) to standard 08xx display', () => {
    expect(formatPhoneNumber('+6287875856918')).toBe('0878-7585-6918');
    expect(formatPhoneNumber('6287875856918')).toBe('0878-7585-6918');
  });

  it('normalizes mobile numbers starting with 8 without leading 0', () => {
    expect(formatPhoneNumber('81234567890')).toBe('0812-3456-7890');
  });

  it('formats 11-digit numbers correctly', () => {
    expect(formatPhoneNumber('08123456789')).toBe('0812-3456-789');
  });

  it('handles null, undefined, or empty strings gracefully', () => {
    expect(formatPhoneNumber(null)).toBe('');
    expect(formatPhoneNumber(undefined)).toBe('');
    expect(formatPhoneNumber('')).toBe('');
    expect(formatPhoneNumber('-')).toBe('');
  });
});

describe('getCleanCallNumber Utility', () => {
  it('cleans non-numeric characters and formats for dialer tel: link', () => {
    expect(getCleanCallNumber('+62 878-7585-6918')).toBe('087875856918');
    expect(getCleanCallNumber('6281234567890')).toBe('081234567890');
    expect(getCleanCallNumber('0812-3456-7890')).toBe('081234567890');
  });

  it('returns empty string for invalid or empty input', () => {
    expect(getCleanCallNumber(null)).toBe('');
    expect(getCleanCallNumber('')).toBe('');
  });
});
