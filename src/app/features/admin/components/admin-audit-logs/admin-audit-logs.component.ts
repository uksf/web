import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from '@app/core/services/signalr.service';
import { AuditLog } from '@app/features/admin/models/logging';
import { PagedResult } from '@app/shared/models/paged-result';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { Clipboard } from '@angular/cdk/clipboard';
import { first } from 'rxjs/operators';
import { LogsService } from '../../services/logs.service';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { AdminPageComponent } from '../admin-page/admin-page.component';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { FormsModule } from '@angular/forms';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-admin-audit-logs',
    templateUrl: './admin-audit-logs.component.html',
    styleUrls: ['./admin-audit-logs.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        AdminPageComponent,
        TextInputComponent,
        FormsModule,
        FlexFillerComponent,
        MatProgressSpinner,
        MatTable,
        MatSort,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatSortHeader,
        MatCellDef,
        MatCell,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        MatPaginator,
        DatePipe
    ]
})
export class AdminAuditLogsComponent extends AdminLogsComponent implements OnInit, AfterViewInit, OnDestroy {
    auditLogDisplayedColumns = ['timestamp', 'who', 'message'];
    datasource: MatTableDataSource<AuditLog> = new MatTableDataSource<AuditLog>();

    constructor(logsService: LogsService, dialog: MatDialog, signalrService: SignalRService, clipboard: Clipboard) {
        super(logsService, dialog, signalrService, clipboard);
    }

    refreshData() {
        const params = this.buildParams();
        this.logsService
            .getAuditLogs(params)
            .pipe(first())
            .subscribe({
                next: (pagedResult: PagedResult<AuditLog>) => {
                    this.dataLoaded = true;
                    this.paginator.length = pagedResult.totalCount;
                    this.datasource.data = pagedResult.data;
                }
            });
    }
}
