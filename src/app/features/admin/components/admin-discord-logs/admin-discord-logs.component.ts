import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { DiscordLog, DiscordUserEventType } from '@app/features/admin/models/logging';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { PagedResult } from '@app/shared/models/paged-result';
import { first } from 'rxjs/operators';
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
    selector: 'app-admin-discord-logs',
    templateUrl: './admin-discord-logs.component.html',
    styleUrls: ['./admin-discord-logs.component.scss'],
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
export class AdminDiscordLogsComponent extends AdminLogsComponent implements OnInit, OnDestroy {
    launcherLogDisplayedColumns = ['timestamp', 'discordUserEventType', 'instigatorId', 'instigatorName', 'channelName', 'name', 'message'];
    datasource: MatTableDataSource<DiscordLog> = new MatTableDataSource<DiscordLog>();

    constructor() {
        super();
    }

    refreshData() {
        const params = this.buildParams();
        this.logsService
            .getDiscordLogs(params)
            .pipe(first())
            .subscribe({
                next: (pagedResult: PagedResult<DiscordLog>) => {
                    this.dataLoaded = true;
                    this.paginator.length = pagedResult.totalCount;
                    this.datasource.data = pagedResult.data;
                }
            });
    }

    eventTypeToString(eventType: DiscordUserEventType) {
        switch (eventType) {
            case DiscordUserEventType.JOINED:
                return 'JOINED';
            case DiscordUserEventType.LEFT:
                return 'LEFT';
            case DiscordUserEventType.BANNED:
                return 'BANNED';
            case DiscordUserEventType.UNBANNED:
                return 'UNBANNED';
            case DiscordUserEventType.MESSAGE_DELETED:
                return 'MESSAGE DELETED';
        }
    }
}
