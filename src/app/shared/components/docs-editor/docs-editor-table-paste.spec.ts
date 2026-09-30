// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import Quill, { Delta } from 'quill';
import { parseTextTable, textTableOps } from './docs-editor-table-paste';
import { registerDocsFormats } from './docs-editor-formats';
import { DOCS_EDITOR_MODULES, setUpDocsEditor } from './docs-editor-table';

const boxTable = `┌─────────────┬──────────────────────┬─────────────────────┐
│ CAPABILITY  │ BASIC / BASELINE     │ ADVANCED            │
├─────────────┼──────────────────────┼─────────────────────┤
│ Airborne    │ • Air assault        │ • Eagle VCP         │
│             │ • HALO               │ • HAHO              │
│             │                      │ • Fast roping       │
├─────────────┼──────────────────────┼─────────────────────┤
│ Waterborne  │ • Boat movement      │ • Diving            │
└─────────────┴──────────────────────┴─────────────────────┘`;

describe('parseTextTable', () => {
    it('reads a box-drawing table with cells over several lines', () => {
        expect(parseTextTable(boxTable)).toEqual([
            [['CAPABILITY'], ['BASIC / BASELINE'], ['ADVANCED']],
            [['Airborne'], ['• Air assault', '• HALO'], ['• Eagle VCP', '• HAHO', '• Fast roping']],
            [['Waterborne'], ['• Boat movement'], ['• Diving']]
        ]);
    });

    it('reads an ASCII grid table', () => {
        expect(parseTextTable('+---+---+\n| a | b |\n+---+---+\n| c | d |\n|   | e |\n+---+---+')).toEqual([
            [['a'], ['b']],
            [['c'], ['d', 'e']]
        ]);
    });

    it('reads a Markdown table, with <br> as a line break and escaped pipes kept', () => {
        expect(parseTextTable('| Role | Skills |\n|:---|---:|\n| Medic | CPR<br>IV |\n| Pilot \\| Crew | Flying |')).toEqual([
            [['Role'], ['Skills']],
            [['Medic'], ['CPR', 'IV']],
            [['Pilot | Crew'], ['Flying']]
        ]);
    });

    it('pads short rows to the widest row', () => {
        expect(parseTextTable('| a | b | c |\n|---|---|---|\n| d |')).toEqual([
            [['a'], ['b'], ['c']],
            [['d'], [], []]
        ]);
    });

    it('ignores text that is not a table', () => {
        expect(parseTextTable('Just a sentence | with a pipe')).toBeNull();
        expect(parseTextTable('| single |\n|---|\n| column |')).toBeNull();
        expect(parseTextTable('line one\nline two')).toBeNull();
    });
});

describe('textTableOps', () => {
    it('builds one table line per cell, bolds the header and joins cell lines with line breaks', () => {
        const ops = new Delta(
            textTableOps([
                [['A'], ['B']],
                [['one', 'two'], []]
            ])
        ).ops;
        const rows = ops.flatMap((op) => (typeof op.insert === 'string' && /^\n+$/.test(op.insert) ? Array(op.insert.length).fill(op.attributes?.['table']) : []));

        expect(ops.filter((op) => typeof op.insert !== 'string' || !/^\n+$/.test(op.insert))).toEqual([
            { insert: 'A', attributes: { bold: true } },
            { insert: 'B', attributes: { bold: true } },
            { insert: 'one' },
            { insert: { 'line-break': true } },
            { insert: 'two' }
        ]);
        expect(rows).toHaveLength(4);
        expect(rows[0]).toBe(rows[1]);
        expect(rows[2]).toBe(rows[3]);
        expect(rows[0]).not.toBe(rows[2]);
    });
});

describe('docs editor with Quill', () => {
    let quill: Quill;

    beforeEach(() => {
        registerDocsFormats();
        Range.prototype.getBoundingClientRect ??= () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
        document.body.innerHTML = '<div id="editor"></div>';
        quill = new Quill('#editor', { modules: { ...DOCS_EDITOR_MODULES, toolbar: false } });
        setUpDocsEditor(quill);
    });

    const paste = (text: string) => {
        const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
        Object.defineProperty(event, 'clipboardData', { value: { getData: (type: string) => (type === 'text/plain' ? text : '') } });
        quill.root.dispatchEvent(event);
        return event;
    };

    it('turns a pasted box-drawing table into a Quill table', () => {
        quill.setSelection(0, 0);

        const event = paste(boxTable);

        expect(event.defaultPrevented).toBe(true);
        expect(quill.root.querySelectorAll('table tr')).toHaveLength(3);
        expect(quill.root.querySelectorAll('table tr')[1].querySelectorAll('td')[2].querySelectorAll('br.ql-line-break')).toHaveLength(2);
    });

    it('leaves ordinary pasted text to Quill', () => {
        quill.setSelection(0, 0);

        paste('hello | world');

        expect(quill.root.querySelector('table')).toBeNull();
    });

    it('keeps the line break when the document is saved and loaded again', () => {
        quill.setContents(new Delta(textTableOps([[['a', 'b'], ['c']], [['d'], ['e']]])));

        const saved = JSON.parse(JSON.stringify(quill.getContents()));
        quill.setContents([]);
        quill.setContents(saved);

        expect(quill.getContents().ops.filter((op) => typeof op.insert === 'object')).toEqual([{ insert: { 'line-break': true } }]);
        expect(quill.root.querySelectorAll('td')).toHaveLength(4);
    });

    it('adds a line break inside a cell on Enter', () => {
        quill.setContents(new Delta(textTableOps([[['ab'], ['c']], [['d'], ['e']]])));
        quill.setSelection(1, 0);

        quill.root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

        expect(quill.root.querySelectorAll('td')).toHaveLength(4);
        const cell = quill.root.querySelectorAll('td')[0];
        expect(cell.textContent).toBe('ab');
        expect(cell.querySelectorAll('br.ql-line-break')).toHaveLength(1);
        expect(quill.getSelection()?.index).toBe(2);
    });
});
