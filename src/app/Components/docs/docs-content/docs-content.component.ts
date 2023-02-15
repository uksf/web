import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DocumentContent, DocumentMetadata, UpdateDocumentContentRequest } from '../../../Models/Documents';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MessageModalComponent } from '../../../Modals/message-modal/message-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MarkdownService } from 'ngx-markdown';

@Component({
    selector: 'app-docs-content',
    templateUrl: './docs-content.component.html',
    styleUrls: ['./docs-content.component.scss']
})
export class DocsContentComponent implements OnChanges {
    @Input('documentMetadata') documentMetadata: DocumentMetadata;
    documentContent: DocumentContent;
    documentContentMarkdown: string;
    editing: boolean = false;
    pending: boolean = false;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private markdownService: MarkdownService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.documentMetadata) {
            this.documentContent = null;
            return;
        }

        this.httpClient.get(`${this.urls.apiUrl}/docs/folders/${this.documentMetadata.folder}/documents/${this.documentMetadata.id}/content`).subscribe({
            next: (content: DocumentContent) => {
                this.documentContent = content;
                this.renderMarkdown();
            },
            error: () => {}
        });

        const linkRenderer = this.markdownService.renderer.link;
        this.markdownService.renderer.link = (href, title, text) => {
            const html = linkRenderer.call(this.markdownService.renderer, href, title, text);
            return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ');
        };
    }

    renderMarkdown() {
        this.documentContentMarkdown = this.markdownService.compile(this.documentContent.text);
    }

    edit() {
        this.editing = true;
    }

    save() {
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
                    this.renderMarkdown();
                },
                error: (error) => {
                    this.pending = false;
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                }
            });
    }
}
