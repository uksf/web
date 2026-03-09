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
        const contentHeight = totalLines * itemSize; // 6860
        const totalHeight = 7385; // contentHeight + bottom padding
        const viewportSize = 1053;
        const canvasHeight = 347;

        it('should return start 0 when no lines', () => {
            const result = computeMinimapLayout(0, 500, 0, 900, 0, 20);
            expect(result.startLine).toBe(0);
            expect(result.sliderTop).toBe(0);
            expect(result.sliderHeight).toBe(900);
        });

        it('should fill canvas when all content fits in viewport', () => {
            const result = computeMinimapLayout(0, 500, 600, 900, 10, 20);
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
            expect(result.sliderTop + result.sliderHeight).toBe(canvasHeight);
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
            // At any scroll position, sliderTop must equal (viewportFirstLine - startLine) * LINE_HEIGHT_PX
            const positions = [0, 1000, 2000, 3000, 4000, 5000, totalHeight - viewportSize];
            for (const scrollTop of positions) {
                const result = computeMinimapLayout(scrollTop, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
                const viewportFirstLine = Math.min(Math.floor(scrollTop / itemSize), totalLines - 1);
                const expectedSliderTop = (viewportFirstLine - result.startLine) * LINE_HEIGHT_PX;
                expect(result.sliderTop).toBe(
                    Math.max(0, Math.min(expectedSliderTop, canvasHeight - result.sliderHeight))
                );
            }
        });

        it('should never produce negative startLine', () => {
            const result = computeMinimapLayout(0, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
            expect(result.startLine).toBeGreaterThanOrEqual(0);
        });

        it('should not exceed max startLine', () => {
            const scrollTop = totalHeight - viewportSize;
            const visibleLines = Math.floor(canvasHeight / LINE_HEIGHT_PX);
            const result = computeMinimapLayout(scrollTop, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
            expect(result.startLine).toBeLessThanOrEqual(totalLines - visibleLines);
        });

        it('should use real scroll position not clamped to content height', () => {
            // At max scroll, the slider should be at maxSliderTop
            const scrollTop = totalHeight - viewportSize;
            const result = computeMinimapLayout(scrollTop, viewportSize, totalHeight, canvasHeight, totalLines, itemSize);
            expect(result.sliderTop + result.sliderHeight).toBe(canvasHeight);
            // viewportFirstLine should use real scroll, not clamped
            const viewportFirstLine = Math.min(Math.floor(scrollTop / itemSize), totalLines - 1);
            expect(viewportFirstLine).toBeGreaterThan(0);
        });
    });
});
