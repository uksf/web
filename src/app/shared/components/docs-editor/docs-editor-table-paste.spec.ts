// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import Quill, { Delta } from 'quill';
import { parseTextTable, textTableHtml } from './docs-editor-table-paste';
import { DocsEditorModules, loadDocsEditorModules, setUpDocsEditor } from './docs-editor-table';

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

describe('textTableHtml', () => {
    it('makes the first row a header, bullet lines a list and other lines paragraphs', () => {
        expect(
            textTableHtml([
                [['A'], ['B']],
                [['Intro', '• one', '- two', 'After'], []]
            ])
        ).toBe('<table><tr><th><p>A</p></th><th><p>B</p></th></tr><tr><td><p>Intro</p><ul><li>one</li><li>two</li></ul><p>After</p></td><td><p><br></p></td></tr></table>');
    });

    it('escapes HTML in cell text', () => {
        expect(textTableHtml([[['<b>x</b>'], ['a & b']], [['c'], ['d']]])).toContain('<p>&lt;b&gt;x&lt;/b&gt;</p><');
    });
});

describe('docs editor paste with Quill', () => {
    let modules: DocsEditorModules;
    let quill: Quill;

    beforeAll(async () => {
        Range.prototype.getBoundingClientRect ??= () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
        (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
        modules = await loadDocsEditorModules();
    });

    beforeEach(() => {
        document.body.innerHTML = '<div id="editor"></div>';
        quill = new Quill('#editor', { modules: { ...modules.editor, toolbar: false } });
        setUpDocsEditor(quill);
    });

    const paste = (text: string) => {
        const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
        Object.defineProperty(event, 'clipboardData', { value: { getData: (type: string) => (type === 'text/plain' ? text : '') } });
        quill.root.dispatchEvent(event);
    };

    it('turns a pasted box-drawing table into a table with bullet lists in the cells', () => {
        quill.setSelection(0, 0);

        paste(boxTable);

        const rows = quill.root.querySelectorAll('table tr');
        expect(rows).toHaveLength(3);
        expect(rows[0].querySelectorAll('th')).toHaveLength(3);
        expect([...rows[1].querySelectorAll('td')[2].querySelectorAll('li')].map((item) => item.textContent)).toEqual(['Eagle VCP', 'HAHO', 'Fast roping']);
    });

    it('keeps a table pasted into a code block as text', () => {
        quill.setContents(new Delta().insert('code').insert('\n', { 'code-block': 'plain' }));
        quill.setSelection(4, 0);

        paste(boxTable);

        expect(quill.root.querySelector('table')).toBeNull();
    });

    it('leaves ordinary pasted text to Quill', () => {
        quill.setSelection(0, 0);

        paste('hello | world');

        expect(quill.root.querySelector('table')).toBeNull();
    });
});
