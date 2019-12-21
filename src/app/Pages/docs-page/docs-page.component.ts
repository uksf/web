import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from 'app/Services/url.service';
import { MatDialog } from '@angular/material';
import { CreateDocumentModalComponent } from 'app/Modals/documents/create-document-modal/create-document-modal.component';

@Component({
    selector: 'app-docs-page',
    templateUrl: './docs-page.component.html',
    styleUrls: ['./docs-page.component.css']
})
export class DocsPageComponent implements OnInit {
    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) { }

    ngOnInit() { }

    createDocument() {
        this.dialog.open(CreateDocumentModalComponent, { data: '' }).afterClosed().subscribe(_ => {

        });
    }
}
