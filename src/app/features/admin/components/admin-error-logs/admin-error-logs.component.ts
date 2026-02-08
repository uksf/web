import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { SignalRService } from '@app/core/services/signalr.service';
import { ErrorLog } from '@app/features/admin/models/logging';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { PagedResult } from '@app/shared/models/paged-result';
import { Clipboard } from '@angular/cdk/clipboard';
import { first } from 'rxjs/operators';
import { LogsService } from '../../services/logs.service';

@Component({
    selector: 'app-admin-error-logs',
    templateUrl: './admin-error-logs.component.html',
    styleUrls: ['../admin-page/admin-page.component.scss', './admin-error-logs.component.scss'],
})
export class AdminErrorLogsComponent extends AdminLogsComponent implements OnInit, OnDestroy {
    errorLogDisplayedColumns = ['timestamp', 'statusCode', 'method', 'url', 'endpointName', 'userId', 'name', 'message', 'exception'];
    datasource: MatTableDataSource<ErrorLog> = new MatTableDataSource<ErrorLog>();

    constructor(logsService: LogsService, dialog: MatDialog, signalrService: SignalRService, clipboard: Clipboard) {
        super(logsService, dialog, signalrService, clipboard);
    }

    refreshData() {
        const params = this.buildParams();
        this.logsService.getErrorLogs(params).pipe(first()).subscribe({
            next: (pagedResult: PagedResult<ErrorLog>) => {
                this.dataLoaded = true;
                this.paginator.length = pagedResult.totalCount;
                this.datasource.data = pagedResult.data;
            }
        });
    }
}
