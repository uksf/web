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

export function createLineProjection(lines: string[], charsPerRow: number): LineProjection {
    const safeCharsPerRow = Math.max(1, charsPerRow);

    const viewLineOffsets: number[] = [];
    const viewLineCounts: number[] = [];
    let totalViewLines = 0;

    for (const line of lines) {
        viewLineOffsets.push(totalViewLines);
        const count = line.length === 0 ? 1 : Math.ceil(line.length / safeCharsPerRow);
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
