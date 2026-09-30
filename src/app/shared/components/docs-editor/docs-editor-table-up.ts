import Quill from 'quill';
import TableUp, { TableMenuSelect, TableResizeLine, TableSelection, defaultCustomSelect } from 'quill-table-up';

// quill-table-up replaces Quill 2's one-line table cells, so a cell can hold several lines, lists and headers.
// It overrides core blots, so it registers before any editor or viewer is created.
Quill.register({ [`modules/${TableUp.moduleName}`]: TableUp }, true);

const tableOptions = { full: true, fullSwitch: false };

export function editorModules(toolbar: unknown[]) {
    return {
        toolbar: [...toolbar, [{ [TableUp.toolName]: [] }]],
        [TableUp.moduleName]: {
            ...tableOptions,
            customSelect: defaultCustomSelect,
            modules: [{ module: TableSelection, options: { selectColor: '#fec40040' } }, { module: TableMenuSelect }, { module: TableResizeLine }]
        }
    };
}

export const viewerModules = { [TableUp.moduleName]: tableOptions };
