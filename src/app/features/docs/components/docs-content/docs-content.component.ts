import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DocumentContent, DocumentMetadata, UpdateDocumentContentRequest } from '@app/Models/Documents';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { MessageModalComponent } from '@app/Modals/message-modal/message-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { UksfError } from '@app/Models/Response';

@Component({
    selector: 'app-docs-content',
    templateUrl: './docs-content.component.html',
    styleUrls: ['./docs-content.component.scss', './docs-content.quill.scss']
})
export class DocsContentComponent implements OnChanges {
    @Input('documentMetadata') documentMetadata: DocumentMetadata;
    documentContent: DocumentContent;
    editing: boolean = false;
    pending: boolean = false;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.documentMetadata) {
            this.documentContent = null;
            return;
        }

        this.httpClient.get(`${this.urls.apiUrl}/docs/folders/${this.documentMetadata.folder}/documents/${this.documentMetadata.id}/content`).subscribe({
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
            .subscribe({
                next: (content: DocumentContent) => {
                    this.pending = false;
                    this.documentContent = content;
                },
                error: (error) => {
                    this.pending = false;
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                }
            });
    }

    onContentChanged(event) {
        // console.log(event);
    }
}
