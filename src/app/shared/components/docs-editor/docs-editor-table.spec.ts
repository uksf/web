// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import Quill from 'quill';
import { DocsEditorModules, loadDocsEditorModules } from './docs-editor-table';

describe('docs editor tables', () => {
    let modules: DocsEditorModules;

    beforeAll(async () => {
        Range.prototype.getBoundingClientRect ??= () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });
        (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
        modules = await loadDocsEditorModules();
    });

    it('swaps Quill’s table button for the table-up picker and keeps full-width tables', () => {
        const toolbar = modules.editor['toolbar'] as unknown[];

        expect(toolbar.flat().filter((tool) => tool === 'table')).toEqual([]);
        expect(toolbar[toolbar.length - 1]).toEqual([{ 'table-up': [] }]);
        expect(modules.editor['table-up']).toMatchObject({ full: true, fullSwitch: false });
        expect(modules.viewer).toEqual({ 'table-up': { full: true, fullSwitch: false } });
    });

    it('holds a bullet list and several lines in one cell, and keeps them when saved and loaded', () => {
        document.body.innerHTML = '<div id="editor"></div><div id="viewer"></div>';
        const editor = new Quill('#editor', { modules: { ...modules.editor, toolbar: false } });
        editor.setContents(
            editor.clipboard.convert({ html: '<table><tr><td><p>Air</p></td><td><ul><li>One</li><li>Two</li></ul><p>Note</p></td></tr></table>' })
        );

        const saved = JSON.parse(JSON.stringify(editor.getContents()));
        const viewer = new Quill('#viewer', { readOnly: true, modules: modules.viewer });
        viewer.setContents(saved);

        const cells = viewer.root.querySelectorAll('td');
        expect(cells).toHaveLength(2);
        expect([...cells[1].querySelectorAll('li')].map((item) => item.textContent)).toEqual(['One', 'Two']);
        expect(cells[1].textContent).toContain('Note');
    });
});
