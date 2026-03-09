import { describe, it, expect } from 'vitest';
import { computeMinimapLayout } from './log-minimap.component';

describe('LogMinimapComponent', () => {
    describe('computeMinimapLayout', () => {
        it('should return start 0 when all lines fit', () => {
            const result = computeMinimapLayout(0, 500, 1000, 900, 100, 20);
            expect(result.startLine).toBe(0);
        });

        it('should return start 0 at top of scroll', () => {
            const result = computeMinimapLayout(0, 500, 10000, 900, 5000, 20);
            expect(result.startLine).toBe(0);
            expect(result.sliderTop).toBe(0);
        });

        it('should place slider at bottom when scrolled to end', () => {
            const viewportSize = 500;
            const totalHeight = 10000;
            const scrollTop = totalHeight - viewportSize;
            const canvasHeight = 900;
            const result = computeMinimapLayout(scrollTop, viewportSize, totalHeight, canvasHeight, 5000, 20);
            expect(result.sliderTop + result.sliderHeight).toBe(canvasHeight);
        });

        it('should have proportional slider height', () => {
            // viewport = 500, totalHeight = 10000 → 5% of canvas
            const result = computeMinimapLayout(0, 500, 10000, 900, 5000, 20);
            const expectedHeight = Math.max(Math.round(0.05 * 900), 20);
            expect(result.sliderHeight).toBe(expectedHeight);
        });

        it('should enforce minimum slider height of 20px', () => {
            const result = computeMinimapLayout(0, 10, 100000, 900, 50000, 20);
            expect(result.sliderHeight).toBeGreaterThanOrEqual(20);
        });

        it('should fill canvas when no scroll content', () => {
            const result = computeMinimapLayout(0, 500, 0, 900, 0, 20);
            expect(result.sliderTop).toBe(0);
            expect(result.sliderHeight).toBe(900);
        });

        it('should align slider over viewport content at midpoint', () => {
            const viewportSize = 500;
            const totalHeight = 10000;
            const scrollTop = (totalHeight - viewportSize) / 2;
            const canvasHeight = 900;
            const result = computeMinimapLayout(scrollTop, viewportSize, totalHeight, canvasHeight, 5000, 20);

            // The viewport first line should be at the slider's top position in the minimap
            const viewportFirstLine = Math.floor(scrollTop / 20);
            const linesAboveSlider = Math.floor(result.sliderTop / 2); // LINE_HEIGHT_PX = 2
            expect(result.startLine).toBe(viewportFirstLine - linesAboveSlider);
        });

        it('should never produce negative startLine', () => {
            // At the top, viewportFirstLine=0 and sliderTop=0, so startLine=0
            const result = computeMinimapLayout(0, 500, 10000, 900, 5000, 20);
            expect(result.startLine).toBeGreaterThanOrEqual(0);
        });

        it('should not exceed max startLine', () => {
            const viewportSize = 500;
            const totalHeight = 10000;
            const scrollTop = totalHeight - viewportSize;
            const canvasHeight = 900;
            const totalLines = 5000;
            const visibleLines = Math.floor(canvasHeight / 2);
            const result = computeMinimapLayout(scrollTop, viewportSize, totalHeight, canvasHeight, totalLines, 20);
            expect(result.startLine).toBeLessThanOrEqual(totalLines - visibleLines);
        });
    });
});
