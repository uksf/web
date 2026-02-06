import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from '@app/core/services/signalr.service';
import { LauncherLog } from '@app/features/admin/models/Logging';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { PagedResult } from '@app/shared/models/PagedResult';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
    selector: 'app-admin-launcher-logs',
    templateUrl: './admin-launcher-logs.component.html',
    styleUrls: ['../admin-page/admin-page.component.scss', './admin-launcher-logs.component.scss'],
})
export class AdminLauncherLogsComponent extends AdminLogsComponent implements OnInit, OnDestroy {
    launcherLogDisplayedColumns = ['timestamp', 'userId', 'name', 'version', 'message'];
    datasource: MatTableDataSource<LauncherLog> = new MatTableDataSource<LauncherLog>();

    constructor(httpClient: HttpClient, urls: UrlService, dialog: MatDialog, signalrService: SignalRService, clipboard: Clipboard) {
        super(httpClient, urls, dialog, signalrService, clipboard);
    }

    refreshData() {
        const params = this.buildParams();
        this.httpClient
            .get<PagedResult<LauncherLog>>(`${this.urls.apiUrl}/logging/launcher`, { params })
            .subscribe({
                next: (pagedResult: PagedResult<LauncherLog>) => {
                    this.dataLoaded = true;
                    this.paginator.length = pagedResult.totalCount;
                    this.datasource.data = pagedResult.data;
                }
            });
    }
}
