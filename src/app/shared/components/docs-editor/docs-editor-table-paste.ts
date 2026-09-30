import type Quill from 'quill';

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

const BULLET = /^[•▪◦‣*-]\s+/;

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Lines that start with a bullet become a list; the others become paragraphs
function cellHtml(lines: string[]) {
    let html = '';
    let list = '';
    for (const line of [...lines, '']) {
        if (BULLET.test(line)) {
            list += `<li>${escapeHtml(line.replace(BULLET, ''))}</li>`;
            continue;
        }
        if (list) {
            html += `<ul>${list}</ul>`;
            list = '';
        }
        if (line !== '') {
            html += `<p>${escapeHtml(line.replace(/^\*\*(.*)\*\*$/, '$1'))}</p>`;
        }
    }
    return html || '<p><br></p>';
}

// The first row is the header
export function textTableHtml(table: TextTable): string {
    const rows = table.map((row, rowIndex) => {
        const tag = rowIndex === 0 ? 'th' : 'td';
        return `<tr>${row.map((cell) => `<${tag}>${cellHtml(cell)}</${tag}>`).join('')}</tr>`;
    });
    return `<table>${rows.join('')}</table>`;
}

export function pasteTextTables(quill: Quill) {
    quill.root.addEventListener(
        'paste',
        (event: ClipboardEvent) => {
            const html = event.clipboardData?.getData('text/html') ?? '';
            const table = html.includes('<table') ? null : parseTextTable(event.clipboardData?.getData('text/plain') ?? '');
            const range = quill.getSelection(true);
            if (!table || !range) {
                return;
            }
            // Inside a table or a code block the text is kept as typed
            const [line, offset] = quill.getLine(range.index);
            if (quill.getFormat(range)['code-block'] || (line?.domNode as HTMLElement | undefined)?.closest('table')) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            const split = line != null && offset > 0;
            const body = quill.clipboard.convert({ html: textTableHtml(table) });
            const Delta = body.constructor as typeof import('quill').Delta;
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
