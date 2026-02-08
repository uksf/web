import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeAgoPipe } from './time.pipe';

describe('TimeAgoPipe', () => {
    let pipe: TimeAgoPipe;
    const mockChangeDetectorRef = { markForCheck: vi.fn() } as any;
    const mockNgZone = {
        run: vi.fn((fn) => fn()),
        runOutsideAngular: vi.fn((fn) => fn())
    } as any;

    beforeEach(() => {
        vi.useFakeTimers();
        pipe = new TimeAgoPipe(mockChangeDetectorRef, mockNgZone);
    });

    afterEach(() => {
        pipe.ngOnDestroy();
        vi.useRealTimers();
    });

    it('should return empty string for invalid date', () => {
        expect(pipe.transform(new Date('invalid'))).toBe('');
    });

    it('should return "a few seconds ago" for dates within 45 seconds', () => {
        const date = new Date(Date.now() - 10 * 1000);
        expect(pipe.transform(date)).toBe('a few seconds ago');
    });

    it('should return "a minute ago" for dates between 45-90 seconds', () => {
        const date = new Date(Date.now() - 60 * 1000);
        expect(pipe.transform(date)).toBe('a minute ago');
    });

    it('should return "X minutes ago" for dates between 90 seconds and 45 minutes', () => {
        const date = new Date(Date.now() - 5 * 60 * 1000);
        expect(pipe.transform(date)).toBe('5 minutes ago');
    });

    it('should return "an hour ago" for dates between 45-90 minutes', () => {
        const date = new Date(Date.now() - 60 * 60 * 1000);
        expect(pipe.transform(date)).toBe('an hour ago');
    });

    it('should return "X hours ago" for dates between 90 minutes and 22 hours', () => {
        const date = new Date(Date.now() - 5 * 60 * 60 * 1000);
        expect(pipe.transform(date)).toBe('5 hours ago');
    });

    it('should return "a day ago" for dates between 22-36 hours', () => {
        const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
        expect(pipe.transform(date)).toBe('a day ago');
    });

    it('should return "X days ago" for dates between 36 hours and 25 days', () => {
        const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        expect(pipe.transform(date)).toBe('10 days ago');
    });

    it('should return "a month ago" for dates between 25-45 days', () => {
        const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        expect(pipe.transform(date)).toBe('a month ago');
    });

    it('should return "X months ago" for dates between 45-345 days', () => {
        const date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        expect(pipe.transform(date)).toBe('3 months ago');
    });

    it('should return "a year ago" for dates between 345-545 days', () => {
        const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
        expect(pipe.transform(date)).toBe('a year ago');
    });

    it('should return "X years ago" for dates beyond 545 days', () => {
        const date = new Date(Date.now() - 800 * 24 * 60 * 60 * 1000);
        expect(pipe.transform(date)).toBe('2 years ago');
    });

    it('should clean up timer on destroy', () => {
        pipe.transform(new Date(Date.now() - 10 * 1000));
        pipe.ngOnDestroy();
        // No error means cleanup was successful
    });
});
