import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { first } from 'rxjs/operators';
import { DocumentContent, DocumentMetadata, UpdateDocumentContentRequest } from '@app/features/docs/models/documents';
import { DocsService } from '../../services/docs.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { UksfError } from '@app/shared/models/response';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';
import { QuillViewComponent, QuillEditorComponent } from 'ngx-quill';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-docs-content',
    templateUrl: './docs-content.component.html',
    styleUrls: ['./docs-content.component.scss', './docs-content.quill.scss'],
    imports: [ButtonComponent, QuillViewComponent, QuillEditorComponent, FormsModule]
})
export class DocsContentComponent implements OnChanges {
    private docsService = inject(DocsService);
    private dialog = inject(MatDialog);

    @Input('documentMetadata') documentMetadata: DocumentMetadata;
    documentContent: DocumentContent;
    editing: boolean = false;
    pending: boolean = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.documentMetadata) {
            this.documentContent = null;
            return;
        }

        this.documentContent = null;
        this.editing = false;

        this.docsService
            .getDocumentContent(this.documentMetadata.folder, this.documentMetadata.id)
            .pipe(first())
            .subscribe({
                next: (content: DocumentContent) => {
                    this.editing = false;
                    this.documentContent = content;
                },
                error: (error: UksfError) => {
                    this.editing = false;
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                }
            });
    }

    edit() {
        this.editing = true;
    }

    save() {
        if (this.pending) {
            return;
        }

        this.editing = false;
        this.pending = true;

        const updateContentRequest: UpdateDocumentContentRequest = {
            newText: this.documentContent.text,
            lastKnownUpdated: this.documentContent.lastUpdated
        };
        this.docsService
            .updateDocumentContent(this.documentMetadata.folder, this.documentMetadata.id, updateContentRequest)
            .pipe(first())
            .subscribe({
                next: (content: DocumentContent) => {
                    this.pending = false;
                    this.documentContent = content;
                },
                error: (error: UksfError) => {
                    this.pending = false;
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                }
            });
    }

    onContentChanged(_event: { html: string; text: string }) {}
}
