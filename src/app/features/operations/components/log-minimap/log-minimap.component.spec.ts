import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    lineToCanvasY,
    canvasYToLine,
    getViewportSliderRect,
    findSearchResultAtY
} from './log-minimap.component';
import { RptLogSearchResult } from '../../models/game-server';

describe('LogMinimapComponent', () => {
    describe('lineToCanvasY', () => {
        it('should map line 0 to y=0', () => {
            expect(lineToCanvasY(0, 1000, 500)).toBe(0);
        });

        it('should map proportionally', () => {
            expect(lineToCanvasY(250, 500, 500)).toBe(250);
        });

        it('should scale when more lines than pixels', () => {
            expect(lineToCanvasY(5000, 10000, 500)).toBeCloseTo(250);
        });

        it('should return 0 when totalLines is 0', () => {
            expect(lineToCanvasY(5, 0, 500)).toBe(0);
        });
    });

    describe('getViewportSliderRect', () => {
        it('should return correct rect for middle of document', () => {
            const rect = getViewportSliderRect(5000, 500, 20000, 400);
            expect(rect.top).toBeCloseTo(100);
            expect(rect.height).toBeCloseTo(10);
        });

        it('should clamp to canvas height', () => {
            const rect = getViewportSliderRect(19500, 500, 20000, 400);
            expect(rect.top + rect.height).toBeLessThanOrEqual(400);
        });

        it('should handle zero totalHeight', () => {
            const rect = getViewportSliderRect(0, 500, 0, 400);
            expect(rect.top).toBe(0);
            expect(rect.height).toBe(400);
        });
    });

    describe('canvasYToLine', () => {
        it('should convert canvas y position to line number', () => {
            expect(canvasYToLine(250, 1000, 500)).toBe(500);
        });

        it('should clamp to valid range', () => {
            expect(canvasYToLine(-10, 1000, 500)).toBe(0);
            expect(canvasYToLine(600, 1000, 500)).toBe(1000);
        });

        it('should return 0 when canvas height is 0', () => {
            expect(canvasYToLine(100, 1000, 0)).toBe(0);
        });
    });

    describe('findSearchResultAtY', () => {
        it('should return -1 when no search results', () => {
            expect(findSearchResultAtY(100, [], 1000, 500, 5)).toBe(-1);
        });

        it('should return nearest result index within tolerance', () => {
            const results: RptLogSearchResult[] = [
                { lineIndex: 100, text: 'a' },
                { lineIndex: 500, text: 'b' },
                { lineIndex: 900, text: 'c' }
            ];
            expect(findSearchResultAtY(252, results, 1000, 500, 5)).toBe(1);
        });

        it('should return -1 when click is outside tolerance', () => {
            const results: RptLogSearchResult[] = [
                { lineIndex: 100, text: 'a' }
            ];
            expect(findSearchResultAtY(200, results, 1000, 500, 5)).toBe(-1);
        });
    });

    describe('canvasYToLine emitting scrollToLine', () => {
        it('should calculate correct line for click position', () => {
            // Verifies the logic that handleCanvasClick delegates to:
            // canvasYToLine(100, 1000, 500) => line 200
            const line = canvasYToLine(100, 1000, 500);
            expect(line).toBe(200);
        });
    });
});
