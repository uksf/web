import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from 'app/Services/signalr.service';
import { LauncherLog } from '../../../Models/Logging';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { PagedResult } from '../../../Models/PagedResult';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
    selector: 'app-admin-launcher-logs',
    templateUrl: './admin-launcher-logs.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.scss', './admin-launcher-logs.component.scss'],
})
export class AdminLauncherLogsComponent extends AdminLogsComponent implements OnInit, OnDestroy {
    launcherLogDisplayedColumns = ['id', 'timestamp', 'userId', 'name', 'version', 'message'];
    datasource: MatTableDataSource<LauncherLog> = new MatTableDataSource<LauncherLog>();

    constructor(httpClient: HttpClient, urls: UrlService, dialog: MatDialog, signalrService: SignalRService, clipboard: Clipboard) {
        super(httpClient, urls, dialog, signalrService, clipboard);
    }

    refreshData() {
        const params = this.buildParams();
        this.httpClient
            .get<PagedResult<LauncherLog>>(`${this.urls.apiUrl}/logging/launcher`, { params })
            .subscribe((pagedResult: PagedResult<LauncherLog>) => {
                this.dataLoaded = true;
                this.paginator.length = pagedResult.totalCount;
                this.datasource.data = pagedResult.data;
            });
    }
}
