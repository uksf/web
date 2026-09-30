import type Quill from 'quill';
import type { Delta, Range } from 'quill';

export const LINE_BREAK = 'line-break';
export const LINE_BREAK_CLASS = 'ql-line-break';

// Quill is loaded lazily by ngx-quill, so the format and Delta come from the running instance, not a static import
export const loadDocsFormats = () => import('./docs-editor-formats').then((formats) => formats.registerDocsFormats());

export function deltaFor(quill: Quill): typeof Delta {
    return (quill.constructor as typeof Quill).import('delta') as typeof Delta;
}

interface TableModule {
    getTable(range: Range): [{ offset(root: unknown): number; length(): number } | null, unknown, unknown, number];
}

interface BindingContext {
    suffix: string;
    event: KeyboardEvent;
}

function insertLineBreak(quill: Quill, range: Range, suffix: string) {
    quill.deleteText(range.index, range.length, 'user');
    quill.insertEmbed(range.index, LINE_BREAK, true, 'user');
    // A trailing <br> draws no new line, so a break at the end of a line needs a second one to show the caret below
    if (suffix === '') {
        quill.insertEmbed(range.index + 1, LINE_BREAK, true, 'user');
    }
    quill.setSelection(range.index + 1, 0, 'silent');
}

// Replaces Quill's 'table enter': Enter and Shift+Enter add a line inside the cell. Ctrl/Cmd+Enter adds a paragraph below the table.
export const TABLE_KEYBOARD_BINDINGS = {
    'table enter': {
        key: 'Enter',
        shiftKey: null,
        format: ['table'],
        handler(this: { quill: Quill }, range: Range, context: BindingContext) {
            if (context.event.ctrlKey || context.event.metaKey) {
                const [table] = (this.quill.getModule('table') as TableModule).getTable(range);
                if (table) {
                    const index = table.offset(this.quill.scroll) + table.length();
                    const DeltaClass = deltaFor(this.quill);
                    this.quill.updateContents(new DeltaClass().retain(index).insert('\n'), 'user');
                    this.quill.setSelection(index, 0, 'user');
                }
                return false;
            }
            insertLineBreak(this.quill, range, context.suffix);
            return false;
        }
    }
};

// Pasted <br> inside a table cell, or copied from this editor, stays a line break instead of splitting the table
export function matchLineBreak(node: Node, delta: Delta) {
    const element = node as HTMLElement;
    if (element.classList?.contains(LINE_BREAK_CLASS) || element.closest?.('td, th')) {
        const DeltaClass = delta.constructor as typeof Delta;
        return new DeltaClass().insert({ [LINE_BREAK]: true });
    }
    return delta;
}
