import { describe, it, expect, vi } from 'vitest';
import { DOCS_EDITOR_MODULES, decorateTableButtons } from './docs-editor-table';

describe('docs editor tables', () => {
    const tableActions = ['table', 'table-row', 'table-column', 'table-delete-row', 'table-delete-column', 'table-delete'];

    it('enables the table module and puts every table action in one toolbar group', () => {
        const groups = DOCS_EDITOR_MODULES.toolbar.container as unknown[];

        expect(DOCS_EDITOR_MODULES.table).toBe(true);
        expect(groups.filter((group) => Array.isArray(group) && group.includes('table'))).toEqual([tableActions]);
    });

    it('routes toolbar clicks to the Quill table module', () => {
        const table = { insertTable: vi.fn(), insertRowBelow: vi.fn(), insertColumnRight: vi.fn(), deleteRow: vi.fn(), deleteColumn: vi.fn(), deleteTable: vi.fn() };
        const toolbar = { quill: { getModule: vi.fn().mockReturnValue(table) } };

        for (const action of tableActions) {
            DOCS_EDITOR_MODULES.toolbar.handlers[action].call(toolbar);
        }

        expect(toolbar.quill.getModule).toHaveBeenCalledWith('table');
        expect(table.insertTable).toHaveBeenCalledWith(3, 3);
        expect(table.insertRowBelow).toHaveBeenCalledOnce();
        expect(table.insertColumnRight).toHaveBeenCalledOnce();
        expect(table.deleteRow).toHaveBeenCalledOnce();
        expect(table.deleteColumn).toHaveBeenCalledOnce();
        expect(table.deleteTable).toHaveBeenCalledOnce();
    });

    it('labels the table buttons and gives the new ones icons', () => {
        const quillIcon = '<svg data-quill></svg>';
        const buttons = Object.fromEntries(
            tableActions.map((action) => {
                const attributes: Record<string, string> = {};
                return [`button.ql-${action}`, { attributes, innerHTML: quillIcon, setAttribute: (name: string, value: string) => (attributes[name] = value) }];
            })
        );
        const container = { querySelector: (selector: string) => buttons[selector] ?? null };
        const quill = { getModule: () => ({ container }) } as never;

        decorateTableButtons(quill);

        expect(buttons['button.ql-table'].attributes['title']).toBe('Insert table');
        expect(buttons['button.ql-table'].innerHTML).toBe(quillIcon);
        expect(buttons['button.ql-table-row'].attributes['aria-label']).toBe('Add row below');
        expect(buttons['button.ql-table-row'].innerHTML).toContain('<svg viewBox="0 0 18 18">');
    });
});
