import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from '@app/Services/signalr.service';
import { ErrorLog } from '@app/Models/Logging';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { PagedResult } from '@app/Models/PagedResult';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
    selector: 'app-admin-error-logs',
    templateUrl: './admin-error-logs.component.html',
    styleUrls: ['../admin-page/admin-page.component.scss', './admin-error-logs.component.scss'],
})
export class AdminErrorLogsComponent extends AdminLogsComponent implements OnInit, OnDestroy {
    errorLogDisplayedColumns = ['timestamp', 'statusCode', 'method', 'url', 'endpointName', 'userId', 'name', 'message', 'exception'];
    datasource: MatTableDataSource<ErrorLog> = new MatTableDataSource<ErrorLog>();

    constructor(httpClient: HttpClient, urls: UrlService, dialog: MatDialog, signalrService: SignalRService, clipboard: Clipboard) {
        super(httpClient, urls, dialog, signalrService, clipboard);
    }

    refreshData() {
        const params = this.buildParams();
        this.httpClient
            .get<PagedResult<ErrorLog>>(`${this.urls.apiUrl}/logging/error`, { params })
            .subscribe((pagedResult: PagedResult<ErrorLog>) => {
                this.dataLoaded = true;
                this.paginator.length = pagedResult.totalCount;
                this.datasource.data = pagedResult.data;
            });
    }
}
