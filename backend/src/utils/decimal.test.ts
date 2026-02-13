/**
 * Decimal Utility Tests
 * Tests: decimalToNumber, decimalToString
 */
import { describe, it, expect } from 'vitest';
import { decimalToNumber, decimalToString } from '../utils/decimal';

describe('decimalToNumber', () => {
  it('should return 0 for null', () => {
    expect(decimalToNumber(null)).toBe(0);
  });

  it('should return 0 for undefined', () => {
    expect(decimalToNumber(undefined)).toBe(0);
  });

  it('should return number as-is', () => {
    expect(decimalToNumber(500)).toBe(500);
    expect(decimalToNumber(3.14)).toBe(3.14);
  });

  it('should convert string to number', () => {
    expect(decimalToNumber('500')).toBe(500);
    expect(decimalToNumber('3.14')).toBe(3.14);
  });

  it('should handle Prisma Decimal-like objects with toNumber()', () => {
    const decimal = { toNumber: () => 500, toString: () => '500' };
    expect(decimalToNumber(decimal)).toBe(500);
  });

  it('should fall back to toString() for objects without toNumber()', () => {
    const obj = { toString: () => '123.45' };
    expect(decimalToNumber(obj)).toBe(123.45);
  });

  it('should handle NaN-producing values', () => {
    expect(decimalToNumber('abc')).toBeNaN();
  });
});

describe('decimalToString', () => {
  it('should return "0" for null', () => {
    expect(decimalToString(null)).toBe('0');
  });

  it('should return "0" for undefined', () => {
    expect(decimalToString(undefined)).toBe('0');
  });

  it('should return string as-is', () => {
    expect(decimalToString('500')).toBe('500');
  });

  it('should convert number to string', () => {
    expect(decimalToString(500)).toBe('500');
    expect(decimalToString(3.14)).toBe('3.14');
  });

  it('should handle objects with toString()', () => {
    const obj = { toString: () => '123.45' };
    expect(decimalToString(obj)).toBe('123.45');
  });
});
