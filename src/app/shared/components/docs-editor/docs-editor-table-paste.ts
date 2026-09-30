import type Quill from 'quill';
import type { Op } from 'quill';
import { LINE_BREAK, deltaFor } from './docs-editor-line-break';

// rows → cells → lines
export type TextTable = string[][][];

const MARKDOWN_DIVIDER = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/;
const GRID_DIVIDER = /^[┌├└╞╘╒╟╙╓+][─═┼┬┴┤┐┘╪╤╧╫╥╨╡╢╕╛╖╜+\-=:]+$/;
const GRID_ROW = /^[│║|].*[│║|]$/;

function splitCells(line: string, separator: RegExp) {
    return line
        .trim()
        .replace(/^[│║|]/, '')
        .replace(/[│║|]$/, '')
        .split(separator)
        .map((cell) => cell.trim());
}

function parseMarkdown(lines: string[]): TextTable | null {
    if (lines.length < 3 || !MARKDOWN_DIVIDER.test(lines[1]) || !lines[0].includes('|')) {
        return null;
    }
    const rows = [lines[0], ...lines.slice(2)];
    if (!rows.every((line) => line.includes('|'))) {
        return null;
    }
    return rows.map((line) => splitCells(line, /(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|').split(/<br\s*\/?>/i).map((part) => part.trim())));
}

function parseGrid(lines: string[]): TextTable | null {
    if (!lines.every((line) => GRID_DIVIDER.test(line) || GRID_ROW.test(line)) || !lines.some((line) => GRID_DIVIDER.test(line))) {
        return null;
    }
    const rows: TextTable = [];
    let current: string[][] | null = null;
    for (const line of lines) {
        if (GRID_DIVIDER.test(line)) {
            current = null;
            continue;
        }
        const cells = splitCells(line, /[│║|]/);
        if (!current) {
            current = cells.map(() => []);
            rows.push(current);
        }
        cells.forEach((cell, column) => {
            if (cell !== '') {
                (current![column] ??= []).push(cell);
            }
        });
    }
    return rows;
}

// Reads a Markdown table, or a box-drawing / ASCII grid table where a cell may span several text lines
export function parseTextTable(text: string): TextTable | null {
    const lines = text
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');
    const table = parseMarkdown(lines) ?? parseGrid(lines);
    if (!table || table.length < 2) {
        return null;
    }
    const columns = Math.max(...table.map((row) => row.length));
    if (columns < 2) {
        return null;
    }
    return table.map((row) => Array.from({ length: columns }, (_, column) => row[column] ?? []));
}

// The first row is the header, so it is bold
export function textTableOps(table: TextTable): Op[] {
    const ops: Op[] = [];
    table.forEach((row, rowIndex) => {
        const rowId = `row-${Math.random().toString(36).slice(2, 6)}`;
        const attributes = rowIndex === 0 ? { bold: true } : undefined;
        for (const cell of row) {
            cell.forEach((line, lineIndex) => {
                if (lineIndex > 0) {
                    ops.push({ insert: { [LINE_BREAK]: true } });
                }
                if (line !== '') {
                    ops.push({ insert: line.replace(/^\*\*(.*)\*\*$/, '$1'), ...(attributes && { attributes }) });
                }
            });
            ops.push({ insert: '\n', attributes: { table: rowId } });
        }
    });
    return ops;
}

export function pasteTextTables(quill: Quill) {
    quill.root.addEventListener(
        'paste',
        (event: ClipboardEvent) => {
            const html = event.clipboardData?.getData('text/html') ?? '';
            const table = html.includes('<table') ? null : parseTextTable(event.clipboardData?.getData('text/plain') ?? '');
            const range = quill.getSelection(true);
            const format = range ? quill.getFormat(range) : {};
            // Inside a table or a code block the text is kept as typed
            if (!table || !range || format['table'] || format['code-block']) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            const [line, offset] = quill.getLine(range.index);
            const split = line != null && offset > 0;
            const Delta = deltaFor(quill);
            const body = new Delta(textTableOps(table));
            const delta = new Delta().retain(range.index).delete(range.length);
            if (split) {
                delta.insert('\n');
            }
            quill.updateContents(delta.concat(body), 'user');
            quill.setSelection(range.index + (split ? 1 : 0) + body.length(), 0, 'silent');
        },
        true
    );
}
