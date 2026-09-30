import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillEditorComponent, QuillViewComponent } from 'ngx-quill';
import { DocsEditorModules, loadDocsEditorModules, setUpDocsEditor } from './docs-editor-table';

@Component({
    selector: 'app-docs-editor',
    templateUrl: './docs-editor.component.html',
    styleUrls: ['./docs-editor.component.scss'],
    imports: [FormsModule, QuillViewComponent, QuillEditorComponent]
})
export class DocsEditorComponent implements OnInit {
    @Input() content: string | null = null;
    @Input() readonly = false;
    @Output() contentChange = new EventEmitter<string>();
    modules = signal<DocsEditorModules | null>(null);
    setUpDocsEditor = setUpDocsEditor;

    ngOnInit() {
        loadDocsEditorModules().then((modules) => this.modules.set(modules));
    }

    onContentChange(value: string) {
        this.content = value;
        this.contentChange.emit(value);
    }
}
