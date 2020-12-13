import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from 'app/Services/signalr.service';
import { ErrorLog } from '../../../Models/Logging';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { PagedResult } from '../../../Models/PagedResult';

@Component({
    selector: 'app-admin-error-logs',
    templateUrl: './admin-error-logs.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.scss', './admin-error-logs.component.scss'],
})
export class AdminErrorLogsComponent extends AdminLogsComponent implements OnInit, OnDestroy {
    errorLogDisplayedColumns = ['id', 'timestamp', 'httpMethod', 'url', 'userId', 'name', 'message', 'exception'];
    datasource: MatTableDataSource<ErrorLog> = new MatTableDataSource<ErrorLog>();

    constructor(httpClient: HttpClient, urls: UrlService, dialog: MatDialog, signalrService: SignalRService) {
        super(httpClient, urls, dialog, signalrService);
    }

    refreshData() {
        const params = this.buildParams();
        this.httpClient
            .get<PagedResult<ErrorLog>>(`${this.urls.apiUrl}/logging/httpError`, { params })
            .subscribe((pagedResult: PagedResult<ErrorLog>) => {
                this.dataLoaded = true;
                this.paginator.length = pagedResult.totalCount;
                this.datasource.data = pagedResult.data;
            });
    }
}
