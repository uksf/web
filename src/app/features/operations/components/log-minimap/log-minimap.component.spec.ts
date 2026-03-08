import { describe, it, expect } from 'vitest';
import { computeStartLine, computeSlider } from './log-minimap.component';

describe('LogMinimapComponent', () => {
    describe('computeStartLine', () => {
        it('should return 0 when all lines fit', () => {
            expect(computeStartLine(0, 1000, 100, 450, 20)).toBe(0);
        });

        it('should return 0 at top of scroll', () => {
            expect(computeStartLine(0, 10000, 10000, 450, 20)).toBe(0);
        });

        it('should return last page at bottom of scroll', () => {
            const totalLines = 10000;
            const visibleLines = 450;
            const maxScroll = 10000;
            const result = computeStartLine(maxScroll, maxScroll, totalLines, visibleLines, 20);
            expect(result).toBe(totalLines - visibleLines);
        });

        it('should return proportional start line at midpoint', () => {
            const totalLines = 10000;
            const visibleLines = 450;
            const maxScroll = 10000;
            const result = computeStartLine(maxScroll / 2, maxScroll, totalLines, visibleLines, 20);
            expect(result).toBe(Math.round((totalLines - visibleLines) / 2));
        });

        it('should return 0 when maxScroll is 0', () => {
            expect(computeStartLine(0, 0, 100, 450, 20)).toBe(0);
        });
    });

    describe('computeSlider', () => {
        it('should fill canvas when no scroll content', () => {
            const result = computeSlider(0, 500, 0, 900, 0, 0, 450);
            expect(result.top).toBe(0);
            expect(result.height).toBe(900);
        });

        it('should have proportional height', () => {
            // viewport = 500, totalHeight = 10000 → 5% of canvas
            const result = computeSlider(0, 500, 10000, 900, 0, 5000, 450);
            const expectedHeight = Math.max(Math.round(0.05 * 900), 20);
            expect(result.height).toBe(expectedHeight);
        });

        it('should be at top when scrollTop is 0', () => {
            const result = computeSlider(0, 500, 10000, 900, 0, 5000, 450);
            expect(result.top).toBe(0);
        });

        it('should be at bottom when scrolled to end', () => {
            const scrollTop = 9500; // totalHeight - viewportSize
            const result = computeSlider(scrollTop, 500, 10000, 900, 0, 5000, 450);
            expect(result.top + result.height).toBe(900);
        });

        it('should enforce minimum slider height of 20px', () => {
            // Very small viewport relative to total
            const result = computeSlider(0, 10, 100000, 900, 0, 50000, 450);
            expect(result.height).toBeGreaterThanOrEqual(20);
        });
    });
});
