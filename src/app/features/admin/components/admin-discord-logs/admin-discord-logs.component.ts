import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { SignalRService } from '@app/core/services/signalr.service';
import { DiscordLog, DiscordUserEventType } from '@app/features/admin/models/logging';
import { AdminLogsComponent } from '../admin-logs/admin-logs.component';
import { PagedResult } from '@app/shared/models/paged-result';
import { Clipboard } from '@angular/cdk/clipboard';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-admin-discord-logs',
    templateUrl: './admin-discord-logs.component.html',
    styleUrls: ['../admin-page/admin-page.component.scss', './admin-discord-logs.component.scss'],
})
export class AdminDiscordLogsComponent extends AdminLogsComponent implements OnInit, OnDestroy {
    launcherLogDisplayedColumns = ['timestamp', 'discordUserEventType', 'instigatorId', 'instigatorName', 'channelName', 'name', 'message'];
    datasource: MatTableDataSource<DiscordLog> = new MatTableDataSource<DiscordLog>();

    constructor(httpClient: HttpClient, urls: UrlService, dialog: MatDialog, signalrService: SignalRService, clipboard: Clipboard) {
        super(httpClient, urls, dialog, signalrService, clipboard);
    }

    refreshData() {
        const params = this.buildParams();
        this.httpClient
            .get<PagedResult<DiscordLog>>(`${this.urls.apiUrl}/logging/discord`, { params })
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
