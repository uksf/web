import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from '@app/core/services/signalr.service';
import { ErrorLog } from '@app/features/admin/models/logging';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { PagedResult } from '@app/shared/models/paged-result';
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
    selector: 'app-admin-error-logs',
    templateUrl: './admin-error-logs.component.html',
    styleUrls: ['./admin-error-logs.component.scss'],
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
export class AdminErrorLogsComponent extends AdminLogsComponent implements OnInit, OnDestroy {
    errorLogDisplayedColumns = ['timestamp', 'statusCode', 'method', 'url', 'endpointName', 'userId', 'name', 'message', 'exception'];
    datasource: MatTableDataSource<ErrorLog> = new MatTableDataSource<ErrorLog>();

    constructor() {
        const logsService = inject(LogsService);
        const dialog = inject(MatDialog);
        const signalrService = inject(SignalRService);
        const clipboard = inject(Clipboard);

        super(logsService, dialog, signalrService, clipboard);
    }

    refreshData() {
        const params = this.buildParams();
        this.logsService
            .getErrorLogs(params)
            .pipe(first())
            .subscribe({
                next: (pagedResult: PagedResult<ErrorLog>) => {
                    this.dataLoaded = true;
                    this.paginator.length = pagedResult.totalCount;
                    this.datasource.data = pagedResult.data;
                }
            });
    }
}
