import { describe, it, expect } from 'vitest';
import { createLineProjection, countWordWrapLines } from './line-projection';

describe('countWordWrapLines', () => {
    it('returns 1 for empty string', () => {
        expect(countWordWrapLines('', 10)).toBe(1);
    });

    it('returns 1 when text fits on one line', () => {
        expect(countWordWrapLines('hello', 10)).toBe(1);
    });

    it('returns 1 for exact-width text', () => {
        expect(countWordWrapLines('abcdefghij', 10)).toBe(1);
    });

    it('character-breaks a long word with no spaces', () => {
        // 25 chars, 10 per row → 3 lines
        expect(countWordWrapLines('abcdefghijklmnopqrstuvwxy', 10)).toBe(3);
    });

    it('character-breaks exact multiple length word', () => {
        // 20 chars, 10 per row → 2 lines (not 3)
        expect(countWordWrapLines('abcdefghijklmnopqrst', 10)).toBe(2);
    });

    it('wraps at word boundary when word would exceed line', () => {
        // "hello world!" → "hello " (6 chars) then "world!" (6 chars) on next line
        expect(countWordWrapLines('hello world!', 10)).toBe(2);
    });

    it('keeps word on same line when it fits', () => {
        // "hi there" → 8 chars fits in 10
        expect(countWordWrapLines('hi there', 10)).toBe(1);
    });

    it('wraps long word after short word', () => {
        // "ab cdefghijklmno" → "ab " (3) then "cdefghijkl" (10) then "mno" (3)
        expect(countWordWrapLines('ab cdefghijklmno', 10)).toBe(3);
    });

    it('handles multiple words with wrapping', () => {
        // "aaa bbb ccc ddd" (15 chars) at width 10
        // "aaa bbb " (8 chars) fits, "ccc" (3 more = 11) → wrap
        // line 1: "aaa bbb " (8), then "ccc" doesn't fit (8+3=11>10) → wrap
        // Actually: "aaa bbb" = 7, space = 8, "ccc" = 3, 8+3=11>10 → wrap
        // line 1: "aaa bbb ", line 2: "ccc ddd"
        expect(countWordWrapLines('aaa bbb ccc ddd', 10)).toBe(2);
    });

    it('handles space at exactly charsPerRow boundary', () => {
        // "abcdefghi j" → "abcdefghi" (9) + space (col=10 ≥ 10 → wrap) + "j"
        expect(countWordWrapLines('abcdefghi j', 10)).toBe(2);
    });
});

describe('LineProjection', () => {
    it('returns 1 view line per logical line when no wrapping needed', () => {
        const projection = createLineProjection(['abc', 'def', 'ghi'], 10);
        expect(projection.viewLineCount).toBe(3);
        expect(projection.getViewLine(0)).toEqual({ text: 'abc', logLineIndex: 0 });
        expect(projection.getViewLine(1)).toEqual({ text: 'def', logLineIndex: 1 });
        expect(projection.getViewLine(2)).toEqual({ text: 'ghi', logLineIndex: 2 });
    });

    it('wraps long lines into multiple view lines (charsPerRow=10, 25 chars → 3 view lines)', () => {
        const line = 'abcdefghijklmnopqrstuvwxy'; // 25 chars, no spaces
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

    it('word-wraps lines with spaces', () => {
        // "hello world!" at width 10: wraps "world!" to next line
        const projection = createLineProjection(['hello world!'], 10);
        expect(projection.viewLineCount).toBe(2);
        expect(projection.getViewLineCountForLogLine(0)).toBe(2);
    });

    it('produces same view line offsets regardless of charsPerRow when lines are short enough', () => {
        // RPT log lines ~85 chars: wrap at charsPerRow=80 but not at 150
        const lines = [
            'short line',
            '18:33:56 D:\\Modpack\\Release\\Repo\\@uksf_ace\\addons\\ace_viewrestriction.pbo - 3.20.2.108', // ~85 chars
            'another short line',
        ];

        const narrowProj = createLineProjection(lines, 80);
        const wideProj = createLineProjection(lines, 150);

        // Wide projection: no wrapping, all 1:1
        expect(wideProj.viewLineCount).toBe(3);
        expect(wideProj.logLineToViewLine(2)).toBe(2);

        // Narrow projection: line 1 wraps, shifting line 2's offset
        expect(narrowProj.viewLineCount).toBe(4); // one extra view line from wrapping
        expect(narrowProj.logLineToViewLine(2)).toBe(3); // offset by 1 due to wrapped line

        // This demonstrates why using charsPerRow=80 (minimap default) when the viewport
        // uses a wider value causes search markers to appear at wrong positions
    });

    it('accumulates offset over many wrapped lines', () => {
        // Simulate 100 RPT lines that are ~85 chars (wrap at 80, not at 150)
        const line85 = '18:33:56 D:\\Modpack\\Release\\Repo\\@uksf_ace\\addons\\ace_viewrestriction.pbo - 3.20.2.108';
        const lines = Array.from({ length: 100 }, () => line85);

        const narrowProj = createLineProjection(lines, 80);
        const wideProj = createLineProjection(lines, 150);

        // Wide: 100 view lines (no wrapping)
        expect(wideProj.viewLineCount).toBe(100);
        expect(wideProj.logLineToViewLine(99)).toBe(99);

        // Narrow: each line wraps to 2 view lines → 200 total
        expect(narrowProj.viewLineCount).toBe(200);
        expect(narrowProj.logLineToViewLine(99)).toBe(198); // offset of 99!

        // A search marker at line 99 would be drawn at viewLine 198 instead of 99
        // — nearly 2x the correct position on the scrollbar
    });
});
