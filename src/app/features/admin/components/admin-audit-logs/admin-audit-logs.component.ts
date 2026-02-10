import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from '@app/core/services/signalr.service';
import { AuditLog } from '@app/features/admin/models/logging';
import { PagedResult } from '@app/shared/models/paged-result';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { Clipboard } from '@angular/cdk/clipboard';
import { first } from 'rxjs/operators';
import { LogsService } from '../../services/logs.service';

@Component({
    selector: 'app-admin-audit-logs',
    templateUrl: './admin-audit-logs.component.html',
    styleUrls: ['./admin-audit-logs.component.scss'],
})
export class AdminAuditLogsComponent extends AdminLogsComponent implements OnInit, AfterViewInit, OnDestroy {
    auditLogDisplayedColumns = ['timestamp', 'who', 'message'];
    datasource: MatTableDataSource<AuditLog> = new MatTableDataSource<AuditLog>();

    constructor(logsService: LogsService, dialog: MatDialog, signalrService: SignalRService, clipboard: Clipboard) {
        super(logsService, dialog, signalrService, clipboard);
    }

    refreshData() {
        const params = this.buildParams();
        this.logsService.getAuditLogs(params).pipe(first()).subscribe({
            next: (pagedResult: PagedResult<AuditLog>) => {
                this.dataLoaded = true;
                this.paginator.length = pagedResult.totalCount;
                this.datasource.data = pagedResult.data;
            }
        });
    }
}
