import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from 'app/Services/signalr.service';
import { AuditLog } from '../../../Models/Logging';
import { PagedResult } from '../../../Models/PagedResult';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';

@Component({
    selector: 'app-admin-audit-logs',
    templateUrl: './admin-audit-logs.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.scss', './admin-audit-logs.component.scss'],
})
export class AdminAuditLogsComponent extends AdminLogsComponent implements OnInit, AfterViewInit, OnDestroy {
    auditLogDisplayedColumns = ['id', 'timestamp', 'who', 'message'];
    datasource: MatTableDataSource<AuditLog> = new MatTableDataSource<AuditLog>();

    constructor(httpClient: HttpClient, urls: UrlService, dialog: MatDialog, signalrService: SignalRService) {
        super(httpClient, urls, dialog, signalrService);
    }

    refreshData() {
        const params = this.buildParams();
        this.httpClient
            .get<PagedResult<AuditLog>>(`${this.urls.apiUrl}/logging/audit`, { params })
            .subscribe((pagedResult: PagedResult<AuditLog>) => {
                this.dataLoaded = true;
                this.paginator.length = pagedResult.totalCount;
                this.datasource.data = pagedResult.data;
            });
    }
}
