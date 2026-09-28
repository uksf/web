import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillEditorComponent, QuillViewComponent } from 'ngx-quill';
import { DOCS_EDITOR_MODULES, decorateTableButtons } from './docs-editor-table';

@Component({
    selector: 'app-docs-editor',
    templateUrl: './docs-editor.component.html',
    styleUrls: ['./docs-editor.component.scss'],
    imports: [FormsModule, QuillViewComponent, QuillEditorComponent]
})
export class DocsEditorComponent {
    @Input() content: string | null = null;
    @Input() readonly = false;
    @Output() contentChange = new EventEmitter<string>();
    modules = DOCS_EDITOR_MODULES;
    decorateTableButtons = decorateTableButtons;

    onContentChange(value: string) {
        this.content = value;
        this.contentChange.emit(value);
    }
}
