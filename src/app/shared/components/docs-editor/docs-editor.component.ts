import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillEditorComponent, QuillViewComponent } from 'ngx-quill';

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
    modules = { table: true };

    onContentChange(value: string) {
        this.content = value;
        this.contentChange.emit(value);
    }
}
