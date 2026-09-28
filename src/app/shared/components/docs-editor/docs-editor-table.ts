import { defaultModules } from 'ngx-quill/config';
import type Quill from 'quill';

interface TableModule {
    insertTable(rows: number, columns: number): void;
    insertRowBelow(): void;
    insertColumnRight(): void;
    deleteRow(): void;
    deleteColumn(): void;
    deleteTable(): void;
}

interface TableAction {
    title: string;
    icon?: string;
    run: (table: TableModule) => void;
}

const icon = (body: string) => `<svg viewBox="0 0 18 18">${body}</svg>`;

// Quill 2 ships the table module without toolbar controls. The 'table' button keeps Quill's own icon.
const TABLE_ACTIONS: Record<string, TableAction> = {
    table: { title: 'Insert table', run: (table) => table.insertTable(3, 3) },
    'table-row': {
        title: 'Add row below',
        icon: icon('<rect class="ql-stroke" x="3" y="2" width="12" height="7"/><line class="ql-stroke" x1="9" y1="11" x2="9" y2="17"/><line class="ql-stroke" x1="6" y1="14" x2="12" y2="14"/>'),
        run: (table) => table.insertRowBelow()
    },
    'table-column': {
        title: 'Add column to the right',
        icon: icon('<rect class="ql-stroke" x="2" y="3" width="7" height="12"/><line class="ql-stroke" x1="11" y1="9" x2="17" y2="9"/><line class="ql-stroke" x1="14" y1="6" x2="14" y2="12"/>'),
        run: (table) => table.insertColumnRight()
    },
    'table-delete-row': {
        title: 'Delete row',
        icon: icon('<rect class="ql-stroke" x="3" y="2" width="12" height="7"/><line class="ql-stroke" x1="6" y1="14" x2="12" y2="14"/>'),
        run: (table) => table.deleteRow()
    },
    'table-delete-column': {
        title: 'Delete column',
        icon: icon('<rect class="ql-stroke" x="2" y="3" width="7" height="12"/><line class="ql-stroke" x1="11" y1="9" x2="17" y2="9"/>'),
        run: (table) => table.deleteColumn()
    },
    'table-delete': {
        title: 'Delete table',
        icon: icon('<rect class="ql-stroke" x="3" y="3" width="12" height="12"/><line class="ql-stroke" x1="6" y1="6" x2="12" y2="12"/><line class="ql-stroke" x1="12" y1="6" x2="6" y2="12"/>'),
        run: (table) => table.deleteTable()
    }
};

const baseToolbar = (defaultModules.toolbar as unknown[]).filter((group) => !(Array.isArray(group) && group.includes('table')));

export const DOCS_EDITOR_MODULES = {
    table: true,
    toolbar: {
        container: [...baseToolbar, Object.keys(TABLE_ACTIONS)],
        handlers: Object.fromEntries(
            Object.entries(TABLE_ACTIONS).map(([name, action]) => [
                name,
                function (this: { quill: Quill }) {
                    action.run(this.quill.getModule('table') as TableModule);
                }
            ])
        )
    }
};

export function decorateTableButtons(quill: Quill) {
    const toolbar = quill.getModule('toolbar') as { container?: HTMLElement } | undefined;
    for (const [name, action] of Object.entries(TABLE_ACTIONS)) {
        const button = toolbar?.container?.querySelector(`button.ql-${name}`);
        if (!button) {
            continue;
        }
        button.setAttribute('title', action.title);
        button.setAttribute('aria-label', action.title);
        if (action.icon) {
            button.innerHTML = action.icon;
        }
    }
}
