import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from '@app/core/services/signalr.service';
import { LauncherLog } from '@app/features/admin/models/logging';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { PagedResult } from '@app/shared/models/paged-result';
import { Clipboard } from '@angular/cdk/clipboard';
import { first } from 'rxjs/operators';
import { LogsService } from '../../services/logs.service';

@Component({
    selector: 'app-admin-launcher-logs',
    templateUrl: './admin-launcher-logs.component.html',
    styleUrls: ['./admin-launcher-logs.component.scss'],
    standalone: false
})
export class AdminLauncherLogsComponent extends AdminLogsComponent implements OnInit, OnDestroy {
    launcherLogDisplayedColumns = ['timestamp', 'userId', 'name', 'version', 'message'];
    datasource: MatTableDataSource<LauncherLog> = new MatTableDataSource<LauncherLog>();

    constructor(logsService: LogsService, dialog: MatDialog, signalrService: SignalRService, clipboard: Clipboard) {
        super(logsService, dialog, signalrService, clipboard);
    }

    refreshData() {
        const params = this.buildParams();
        this.logsService.getLauncherLogs(params).pipe(first()).subscribe({
            next: (pagedResult: PagedResult<LauncherLog>) => {
                this.dataLoaded = true;
                this.paginator.length = pagedResult.totalCount;
                this.datasource.data = pagedResult.data;
            }
        });
    }
}
