import { describe, it, expect } from 'vitest';
import { computeMinimapLayout } from './log-minimap.component';

const LINE_HEIGHT_PX = 2;

describe('LogMinimapComponent', () => {
    describe('computeMinimapLayout', () => {
        // Realistic values matching runtime data:
        // 343 view lines, itemSize=20, contentHeight=6860
        // totalHeight includes ~525px bottom padding (42vh of ~1250px window)
        const itemSize = 20;
        const totalLines = 343;
        const _contentHeight = totalLines * itemSize; // 6860
        const totalHeight = 7385; // contentHeight + bottom padding
        const viewportSize = 1053;
        const canvasHeight = 347;

        it('should return start 0 and zero slider when no lines', () => {
            const result = computeMinimapLayout(0, 500, 0, 900, 0, 20);
            expect(result.startLine).toBe(0);
            expect(result.sliderTop).toBe(0);
            expect(result.sliderHeight).toBe(0);
        });

        it('should size slider to content when all content fits in viewport', () => {
            // 10 lines × 2px = 20px minimap content, canvas is 900px
            const result = computeMinimapLayout(0, 500, 600, 900, 10, 20);
            expect(result.startLine).toBe(0);
            expect(result.sliderTop).toBe(0);
            expect(result.sliderHeight).toBe(10 * LINE_HEIGHT_PX);
        });

        it('should cap slider to canvas height when content fills minimap', () => {
            // 500 lines × 2px = 1000px minimap content, canvas is 900px → capped to 900
            const result = computeMinimapLayout(0, 20000, 20000, 900, 500, 20);
            expect(result.startLine).toBe(0);
            expect(result.sliderTop).toBe(0);
            expect(result.sliderHeight).toBe(900);
        });

        it('should return start 0 and slider at top when scroll is 0', () => {
            const result = computeMinimapLayout(0, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
            expect(result.startLine).toBe(0);
            expect(result.sliderTop).toBe(0);
        });

        it('should place slider at bottom when scrolled to max', () => {
            const scrollTop = totalHeight - viewportSize; // max scroll
            const result = computeMinimapLayout(scrollTop, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
            // Allow ±1px tolerance from rounding fractional line positions
            expect(result.sliderTop + result.sliderHeight).toBeGreaterThanOrEqual(canvasHeight - 1);
            expect(result.sliderTop + result.sliderHeight).toBeLessThanOrEqual(canvasHeight);
        });

        it('should compute slider height from visible viewport lines', () => {
            // VS Code formula: sliderHeight = viewportLineCount * minimapLineHeight
            const result = computeMinimapLayout(0, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
            const expectedHeight = Math.max(Math.round((viewportSize / itemSize) * LINE_HEIGHT_PX), 20);
            expect(result.sliderHeight).toBe(expectedHeight);
        });

        it('should enforce minimum slider height of 20px', () => {
            const result = computeMinimapLayout(0, 10, 100400, 900, 5000, 20);
            expect(result.sliderHeight).toBeGreaterThanOrEqual(20);
        });

        it('should guarantee slider-to-content alignment', () => {
            // At any scroll position, sliderTop must equal round((viewportFirstLine - startLine) * LINE_HEIGHT_PX)
            const positions = [0, 1000, 2000, 3000, 4000, 5000, totalHeight - viewportSize];
            for (const scrollTop of positions) {
                const result = computeMinimapLayout(scrollTop, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
                const viewportFirstLineFrac = Math.min(scrollTop / itemSize, totalLines - 1);
                const expectedSliderTop = Math.round((viewportFirstLineFrac - result.startLine) * LINE_HEIGHT_PX);
                expect(result.sliderTop).toBe(
                    Math.max(0, Math.min(expectedSliderTop, canvasHeight - result.sliderHeight))
                );
            }
        });

        it('should never produce negative startLine', () => {
            const result = computeMinimapLayout(0, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
            expect(result.startLine).toBeGreaterThanOrEqual(0);
        });

        it('should not exceed max startLine (includes padding lines)', () => {
            const scrollTop = totalHeight - viewportSize;
            const visibleLines = Math.floor(canvasHeight / LINE_HEIGHT_PX);
            const totalScrollLines = Math.ceil(totalHeight / itemSize);
            const result = computeMinimapLayout(scrollTop, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
            expect(result.startLine).toBeLessThanOrEqual(totalScrollLines - visibleLines);
        });

        it('should allow startLine beyond content lines to show bottom padding', () => {
            // With 50000 lines + padding, when scrolled to bottom the minimap
            // should show empty space below the last content line
            const bigTotalLines = 50000;
            const bigContentHeight = bigTotalLines * itemSize;
            const bigTotalHeight = bigContentHeight + 525; // 42vh padding
            const bigCanvasHeight = 700;
            const scrollTop = bigTotalHeight - viewportSize;
            const result = computeMinimapLayout(scrollTop, viewportSize, bigTotalHeight, bigCanvasHeight, bigTotalLines, itemSize);
            const visibleLines = Math.floor(bigCanvasHeight / LINE_HEIGHT_PX);
            // startLine should be beyond totalLines - visibleLines (into padding territory)
            expect(result.startLine).toBeGreaterThan(bigTotalLines - visibleLines);
        });

        it('should use real scroll position not clamped to content height', () => {
            // At max scroll, the slider should be at or near maxSliderTop
            const scrollTop = totalHeight - viewportSize;
            const result = computeMinimapLayout(scrollTop, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
            // Allow ±1px tolerance from rounding fractional line positions
            expect(result.sliderTop + result.sliderHeight).toBeGreaterThanOrEqual(canvasHeight - 1);
            expect(result.sliderTop + result.sliderHeight).toBeLessThanOrEqual(canvasHeight);
            // viewportFirstLine should use real scroll, not clamped
            const viewportFirstLine = Math.min(scrollTop / itemSize, totalLines - 1);
            expect(viewportFirstLine).toBeGreaterThan(0);
        });
    });
});
