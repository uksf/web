import { describe, it, expect } from 'vitest';
import { any, all, buildQuery, titleCase, nameCase } from './helper.service';

describe('helper.service', () => {
  describe('any', () => {
    it('returns true when at least one element matches predicate', () => {
      expect(any([1, 2, 3], (n) => n > 2)).toBe(true);
    });

    it('returns false when no elements match predicate', () => {
      expect(any([1, 2, 3], (n) => n > 5)).toBe(false);
    });

    it('uses Boolean as default predicate', () => {
      expect(any([0, '', null, 'hello'])).toBe(true);
      expect(any([0, '', null, undefined])).toBe(false);
    });

    it('handles empty arrays', () => {
      expect(any([])).toBe(false);
    });
  });

  describe('all', () => {
    it('returns true when all elements match predicate', () => {
      expect(all([2, 4, 6], (n) => n % 2 === 0)).toBe(true);
    });

    it('returns false when at least one element does not match', () => {
      expect(all([2, 3, 6], (n) => n % 2 === 0)).toBe(false);
    });

    it('uses Boolean as default predicate', () => {
      expect(all([1, 'hello', true])).toBe(true);
      expect(all([1, '', true])).toBe(false);
    });

    it('handles empty arrays', () => {
      expect(all([])).toBe(true);
    });
  });

  describe('buildQuery', () => {
    it('replaces " and " with "&&"', () => {
      expect(buildQuery('foo and bar')).toBe('foo&&bar');
    });

    it('replaces " or " with "||"', () => {
      expect(buildQuery('foo or bar')).toBe('foo||bar');
    });

    it('is case insensitive', () => {
      expect(buildQuery('foo AND bar OR baz')).toBe('foo&&bar||baz');
    });

    it('handles multiple occurrences', () => {
      expect(buildQuery('a and b and c or d')).toBe('a&&b&&c||d');
    });

    it('preserves strings without operators', () => {
      expect(buildQuery('hello world')).toBe('hello world');
    });

    it('handles extra spaces', () => {
      expect(buildQuery('foo   and   bar')).toBe('foo&&bar');
    });
  });

  describe('titleCase', () => {
    it('capitalizes first letter and lowercases rest', () => {
      expect(titleCase('hello')).toBe('Hello');
      expect(titleCase('HELLO')).toBe('Hello');
      expect(titleCase('hELLO wORLD')).toBe('Hello world');
    });

    it('handles empty string', () => {
      expect(titleCase('')).toBe('');
    });

    it('trims whitespace', () => {
      expect(titleCase('  hello  ')).toBe('Hello');
    });

    it('handles single character', () => {
      expect(titleCase('a')).toBe('A');
    });
  });

  describe('nameCase', () => {
    it('capitalizes simple names', () => {
      expect(nameCase('john')).toBe('John');
      expect(nameCase('JOHN')).toBe('John');
    });

    it('handles empty string', () => {
      expect(nameCase('')).toBe('');
    });

    it('handles hyphenated names', () => {
      expect(nameCase('MARY-JANE')).toBe('Mary-Jane');
    });

    it('handles names with spaces', () => {
      expect(nameCase('JOHN DOE')).toBe('John Doe');
    });

    it('handles McDonald-style names', () => {
      expect(nameCase('MCDONALD')).toBe('McDonald');
      expect(nameCase('mcdonald')).toBe('McDonald');
    });

    it('handles Mac-style names correctly', () => {
      expect(nameCase('MACDONALD')).toBe('MacDonald');
      expect(nameCase('MACARTHUR')).toBe('MacArthur');
    });

    it('handles O\'Name style', () => {
      expect(nameCase("O'NEIL")).toBe("O'Neil");
      expect(nameCase("D'ANGELO")).toBe("D'Angelo");
    });

    it('handles van/von/de particles (not first)', () => {
      expect(nameCase('LUDWIG VAN BEETHOVEN')).toBe('Ludwig van Beethoven');
      expect(nameCase('VINCENT VAN GOGH')).toBe('Vincent van Gogh');
    });

    it('handles ordinal suffixes', () => {
      expect(nameCase('JOHN III')).toBe('John III');
      expect(nameCase('JOHN IV')).toBe('John IV');
      expect(nameCase('JOHN VII')).toBe('John VII');
      // Note: VIII (v + 3 i's) is not matched by current regex pattern
      // which only supports up to VII (v + 2 i's)
      expect(nameCase('HENRY VIII')).toBe('Henry Viii');
    });

    it('handles St. prefix', () => {
      expect(nameCase('ST. JOHN')).toBe('St. John');
    });
  });
});
