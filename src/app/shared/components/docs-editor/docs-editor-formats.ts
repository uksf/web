import Quill, { Parchment } from 'quill';
import { LINE_BREAK, LINE_BREAK_CLASS } from './docs-editor-line-break';

// A line break that stays inside its line. Quill 2 table cells hold one line each, so this is how a cell gets several.
class LineBreak extends Parchment.EmbedBlot {
    static blotName = LINE_BREAK;
    static tagName = 'BR';
    static className = LINE_BREAK_CLASS;
    static scope = Parchment.Scope.INLINE_BLOT;

    static value() {
        return true;
    }
}

export function registerDocsFormats() {
    Quill.register(LineBreak, true);
}
