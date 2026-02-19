/**
 * Roster Edit Window Utility Tests
 * Tests: getEditDeadline, isEditWindowOpen
 */
import { describe, it, expect } from 'vitest';
import { getEditDeadline, isEditWindowOpen } from '../utils/rosterEditWindow';

describe('rosterEditWindow', () => {

  // ============= getEditDeadline =============
  describe('getEditDeadline', () => {
    it('should return deadline in same month when useNextMonth=false', () => {
      const deadline = getEditDeadline(2025, 1, 5, false);
      expect(deadline.getFullYear()).toBe(2025);
      expect(deadline.getMonth()).toBe(0); // January
      expect(deadline.getDate()).toBe(5);
    });

    it('should return deadline in next month when useNextMonth=true', () => {
      const deadline = getEditDeadline(2025, 1, 5, true);
      expect(deadline.getFullYear()).toBe(2025);
      expect(deadline.getMonth()).toBe(1); // February
      expect(deadline.getDate()).toBe(5);
    });

    it('should handle year rollover (December → January)', () => {
      const deadline = getEditDeadline(2025, 12, 5, true);
      expect(deadline.getFullYear()).toBe(2026);
      expect(deadline.getMonth()).toBe(0); // January
      expect(deadline.getDate()).toBe(5);
    });

    it('should clamp cutoff day to month length (Feb 30 → Feb 28)', () => {
      const deadline = getEditDeadline(2025, 1, 30, true); // next month = Feb
      expect(deadline.getDate()).toBe(28); // 2025 is not a leap year
    });

    it('should handle leap year February', () => {
      const deadline = getEditDeadline(2024, 1, 29, true); // 2024 is leap year, next month = Feb
      expect(deadline.getDate()).toBe(29);
    });

    it('should clamp cutoff to minimum 1', () => {
      const deadline = getEditDeadline(2025, 6, 0, false);
      expect(deadline.getDate()).toBe(1);
    });

    it('should clamp cutoff to maximum 31', () => {
      const deadline = getEditDeadline(2025, 1, 50, false);
      expect(deadline.getDate()).toBe(31); // January has 31 days
    });

    it('should set time to end of day (23:59:59.999)', () => {
      const deadline = getEditDeadline(2025, 6, 15, false);
      expect(deadline.getHours()).toBe(23);
      expect(deadline.getMinutes()).toBe(59);
      expect(deadline.getSeconds()).toBe(59);
      expect(deadline.getMilliseconds()).toBe(999);
    });
  });

  // ============= isEditWindowOpen =============
  describe('isEditWindowOpen', () => {
    it('should return true when before deadline', () => {
      const now = new Date(2025, 0, 3); // Jan 3
      const result = isEditWindowOpen(2025, 1, 5, false, now);
      expect(result).toBe(true);
    });

    it('should return true when exactly at deadline', () => {
      const now = new Date(2025, 0, 5, 23, 59, 59, 999);
      const result = isEditWindowOpen(2025, 1, 5, false, now);
      expect(result).toBe(true);
    });

    it('should return false when after deadline', () => {
      const now = new Date(2025, 0, 6, 0, 0, 0, 0);
      const result = isEditWindowOpen(2025, 1, 5, false, now);
      expect(result).toBe(false);
    });

    it('should work with useNextMonth=true', () => {
      // Roster for Jan, cutoff 5th of next month (Feb 5)
      const beforeDeadline = new Date(2025, 1, 4); // Feb 4
      const afterDeadline = new Date(2025, 1, 6); // Feb 6

      expect(isEditWindowOpen(2025, 1, 5, true, beforeDeadline)).toBe(true);
      expect(isEditWindowOpen(2025, 1, 5, true, afterDeadline)).toBe(false);
    });

    it('should handle year boundary (Dec roster, cutoff Jan next year)', () => {
      const beforeDeadline = new Date(2026, 0, 1); // Jan 1, 2026
      const afterDeadline = new Date(2026, 0, 6); // Jan 6, 2026

      expect(isEditWindowOpen(2025, 12, 5, true, beforeDeadline)).toBe(true);
      expect(isEditWindowOpen(2025, 12, 5, true, afterDeadline)).toBe(false);
    });
  });
});
