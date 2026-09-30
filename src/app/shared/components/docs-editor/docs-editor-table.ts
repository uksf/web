import { defaultModules } from 'ngx-quill/config';
import type Quill from 'quill';
import { pasteTextTables } from './docs-editor-table-paste';

export interface DocsEditorModules {
    editor: Record<string, unknown>;
    viewer: Record<string, unknown>;
}

// Quill 2's own table button is dropped: quill-table-up adds its table picker in its place
const baseToolbar = (defaultModules.toolbar as unknown[]).filter((group) => !(Array.isArray(group) && group.includes('table')));

// Quill is loaded lazily by ngx-quill, so the table module is too; the editor renders once this resolves
export async function loadDocsEditorModules(): Promise<DocsEditorModules> {
    const tableUp = await import('./docs-editor-table-up');
    return { editor: tableUp.editorModules(baseToolbar), viewer: tableUp.viewerModules };
}

export function setUpDocsEditor(quill: Quill) {
    pasteTextTables(quill);
}
