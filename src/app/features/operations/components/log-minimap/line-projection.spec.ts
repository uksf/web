import { describe, it, expect } from 'vitest';
import { createLineProjection } from './line-projection';

describe('LineProjection', () => {
    it('returns 1 view line per logical line when no wrapping needed', () => {
        const projection = createLineProjection(['abc', 'def', 'ghi'], 10);
        expect(projection.viewLineCount).toBe(3);
        expect(projection.getViewLine(0)).toEqual({ text: 'abc', logLineIndex: 0 });
        expect(projection.getViewLine(1)).toEqual({ text: 'def', logLineIndex: 1 });
        expect(projection.getViewLine(2)).toEqual({ text: 'ghi', logLineIndex: 2 });
    });

    it('wraps long lines into multiple view lines (charsPerRow=10, 25 chars → 3 view lines)', () => {
        const line = 'abcdefghijklmnopqrstuvwxy'; // 25 chars
        const projection = createLineProjection([line], 10);
        expect(projection.viewLineCount).toBe(3);
        expect(projection.getViewLine(0)).toEqual({ text: 'abcdefghij', logLineIndex: 0 });
        expect(projection.getViewLine(1)).toEqual({ text: 'klmnopqrst', logLineIndex: 0 });
        expect(projection.getViewLine(2)).toEqual({ text: 'uvwxy', logLineIndex: 0 });
    });

    it('handles empty lines as 1 view line', () => {
        const projection = createLineProjection(['', 'abc', ''], 10);
        expect(projection.viewLineCount).toBe(3);
        expect(projection.getViewLine(0)).toEqual({ text: '', logLineIndex: 0 });
        expect(projection.getViewLine(1)).toEqual({ text: 'abc', logLineIndex: 1 });
        expect(projection.getViewLine(2)).toEqual({ text: '', logLineIndex: 2 });
    });

    it('handles exact-width lines without extra row (10 chars at charsPerRow=10 → 1 view line)', () => {
        const projection = createLineProjection(['abcdefghij'], 10);
        expect(projection.viewLineCount).toBe(1);
        expect(projection.getViewLine(0)).toEqual({ text: 'abcdefghij', logLineIndex: 0 });
    });

    it('computes correct offsets for mixed lines (short + long + short)', () => {
        const lines = ['hi', 'abcdefghijklmnopqrst', 'ok']; // 2, 20, 2 chars; charsPerRow=10
        const projection = createLineProjection(lines, 10);
        // 'hi' → 1 view line, 'abcdefghijklmnopqrst' → 2 view lines, 'ok' → 1 view line
        expect(projection.viewLineCount).toBe(4);
        expect(projection.viewLineOffsets).toEqual([0, 1, 3]);
    });

    it('returns correct view line content and logical line index', () => {
        const lines = ['hi', 'abcdefghijklmnopqrst', 'ok'];
        const projection = createLineProjection(lines, 10);
        expect(projection.getViewLine(0)).toEqual({ text: 'hi', logLineIndex: 0 });
        expect(projection.getViewLine(1)).toEqual({ text: 'abcdefghij', logLineIndex: 1 });
        expect(projection.getViewLine(2)).toEqual({ text: 'klmnopqrst', logLineIndex: 1 });
        expect(projection.getViewLine(3)).toEqual({ text: 'ok', logLineIndex: 2 });
    });

    it('returns correct view line for multi-line projection', () => {
        const lines = ['12345678901234567890', 'abc']; // 20 chars, 3 chars; charsPerRow=8
        const projection = createLineProjection(lines, 8);
        // '12345678901234567890' → ceil(20/8) = 3 view lines, 'abc' → 1 view line
        expect(projection.viewLineCount).toBe(4);
        expect(projection.getViewLine(0)).toEqual({ text: '12345678', logLineIndex: 0 });
        expect(projection.getViewLine(1)).toEqual({ text: '90123456', logLineIndex: 0 });
        expect(projection.getViewLine(2)).toEqual({ text: '7890', logLineIndex: 0 });
        expect(projection.getViewLine(3)).toEqual({ text: 'abc', logLineIndex: 1 });
    });

    it('handles charsPerRow of 0 gracefully (treat as 1)', () => {
        const projection = createLineProjection(['ab'], 0);
        expect(projection.viewLineCount).toBe(2);
        expect(projection.getViewLine(0)).toEqual({ text: 'a', logLineIndex: 0 });
        expect(projection.getViewLine(1)).toEqual({ text: 'b', logLineIndex: 0 });
    });

    it('handles empty lines array', () => {
        const projection = createLineProjection([], 10);
        expect(projection.viewLineCount).toBe(0);
        expect(projection.viewLineOffsets).toEqual([]);
    });

    it('maps logical line index to view line offset via logLineToViewLine()', () => {
        const lines = ['hi', 'abcdefghijklmnopqrst', 'ok'];
        const projection = createLineProjection(lines, 10);
        expect(projection.logLineToViewLine(0)).toBe(0);
        expect(projection.logLineToViewLine(1)).toBe(1);
        expect(projection.logLineToViewLine(2)).toBe(3);
    });

    it('returns view line count for a logical line via getViewLineCountForLogLine()', () => {
        const lines = ['hi', 'abcdefghijklmnopqrst', 'ok'];
        const projection = createLineProjection(lines, 10);
        expect(projection.getViewLineCountForLogLine(0)).toBe(1);
        expect(projection.getViewLineCountForLogLine(1)).toBe(2);
        expect(projection.getViewLineCountForLogLine(2)).toBe(1);
    });
});
