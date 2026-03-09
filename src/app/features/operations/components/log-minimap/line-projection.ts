export interface ViewLineInfo {
    text: string;
    logLineIndex: number;
}

export interface LineProjection {
    viewLineCount: number;
    viewLineOffsets: number[];
    getViewLine(viewLineIndex: number): ViewLineInfo;
    logLineToViewLine(logLineIndex: number): number;
    getViewLineCountForLogLine(logLineIndex: number): number;
}

/**
 * Count how many visual lines a text string occupies with word-aware wrapping.
 * Matches CSS `white-space: pre-wrap; overflow-wrap: break-word` on a monospace font.
 *
 * - Wraps at spaces when a word would exceed the line width
 * - Breaks within a word only when the word itself is longer than a full line
 */
export function countWordWrapLines(text: string, charsPerRow: number): number {
    if (text.length === 0) return 1;
    if (text.length <= charsPerRow) return 1;

    let lines = 1;
    let col = 0;
    let i = 0;

    while (i < text.length) {
        const ch = text[i];

        if (ch === ' ' || ch === '\t') {
            col++;
            i++;
            if (col >= charsPerRow) {
                lines++;
                col = 0;
            }
            continue;
        }

        // Find end of word (non-space run)
        let wordEnd = i;
        while (wordEnd < text.length && text[wordEnd] !== ' ' && text[wordEnd] !== '\t') {
            wordEnd++;
        }
        const wordLen = wordEnd - i;

        if (col + wordLen <= charsPerRow) {
            // Word fits on current line
            col += wordLen;
            i = wordEnd;
        } else if (col === 0) {
            // Word starts at column 0 but is longer than a line — character-break it
            lines += Math.ceil(wordLen / charsPerRow) - 1;
            col = wordLen % charsPerRow;
            i = wordEnd;
        } else {
            // Word doesn't fit — wrap to next line, re-process from column 0
            lines++;
            col = 0;
        }
    }

    return lines;
}

export function createLineProjection(lines: string[], charsPerRow: number): LineProjection {
    const safeCharsPerRow = Math.max(1, charsPerRow);

    const viewLineOffsets: number[] = [];
    const viewLineCounts: number[] = [];
    let totalViewLines = 0;

    for (const line of lines) {
        viewLineOffsets.push(totalViewLines);
        const count = countWordWrapLines(line, safeCharsPerRow);
        viewLineCounts.push(count);
        totalViewLines += count;
    }

    return {
        viewLineCount: totalViewLines,
        viewLineOffsets,

        getViewLine(viewLineIndex: number): ViewLineInfo {
            // Binary search to find the logical line
            let lo = 0;
            let hi = viewLineOffsets.length - 1;
            while (lo < hi) {
                const mid = (lo + hi + 1) >> 1;
                if (viewLineOffsets[mid] <= viewLineIndex) {
                    lo = mid;
                } else {
                    hi = mid - 1;
                }
            }
            const logLineIndex = lo;
            const subIndex = viewLineIndex - viewLineOffsets[logLineIndex];
            // Character-based text extraction for minimap canvas rendering (approximate)
            const start = subIndex * safeCharsPerRow;
            const text = lines[logLineIndex].substring(start, start + safeCharsPerRow);
            return { text, logLineIndex };
        },

        logLineToViewLine(logLineIndex: number): number {
            return viewLineOffsets[logLineIndex];
        },

        getViewLineCountForLogLine(logLineIndex: number): number {
            return viewLineCounts[logLineIndex];
        },
    };
}
