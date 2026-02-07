import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocumentContent, DocumentMetadata, UpdateDocumentContentRequest } from '@app/features/docs/models/documents';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { UksfError } from '@app/shared/models/response';

@Component({
    selector: 'app-docs-content',
    templateUrl: './docs-content.component.html',
    styleUrls: ['./docs-content.component.scss', './docs-content.quill.scss']
})
export class DocsContentComponent implements OnChanges, OnDestroy {
    private destroy$ = new Subject<void>();
    @Input('documentMetadata') documentMetadata: DocumentMetadata;
    documentContent: DocumentContent;
    editing: boolean = false;
    pending: boolean = false;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {}

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.documentMetadata) {
            this.documentContent = null;
            return;
        }

        this.httpClient.get(`${this.urls.apiUrl}/docs/folders/${this.documentMetadata.folder}/documents/${this.documentMetadata.id}/content`).pipe(takeUntil(this.destroy$)).subscribe({
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
        this.httpClient
            .put(`${this.urls.apiUrl}/docs/folders/${this.documentMetadata.folder}/documents/${this.documentMetadata.id}/content`, updateContentRequest, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
            .pipe(takeUntil(this.destroy$))
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
