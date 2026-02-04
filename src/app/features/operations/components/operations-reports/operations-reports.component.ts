import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateOperationReportModalComponent } from '@app/Modals/create-operation-report-modal/create-operation-report-modal.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-operations-reports',
    templateUrl: './operations-reports.component.html',
    styleUrls: ['../operations-page/operations-page.component.scss', './operations-reports.component.scss']
})
export class OperationsReportsComponent implements OnInit {
    oprepData;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private router: Router) { }

    ngOnInit() {
        this.getReports();
    }

    getReports() {
        this.httpClient.get(this.urls.apiUrl + '/OperationReport').subscribe({
            next: (response) => {
                this.oprepData = response;
            }
        });
    }

    createOprep() {
        this.dialog.open(CreateOperationReportModalComponent, {}).afterClosed().subscribe({
            next: () => {
                this.getReports();
            }
        });
    }

    openOprep(id) {
        this.router.navigate(['/operations/opreps/' + id]);
    }
}
