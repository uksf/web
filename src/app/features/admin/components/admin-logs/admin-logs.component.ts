import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from '@app/Modals/message-modal/message-modal.component';
import { ConnectionContainer, SignalRService } from '@app/Services/signalr.service';
import { BasicLog, LogLevel } from '@app/Models/Logging';
import { PagedResult } from '@app/Models/PagedResult';
import { SortDirection } from '@app/Models/SortDirection';
import { Subject } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-admin-logs',
    templateUrl: './admin-logs.component.html',
    styleUrls: ['../admin-page/admin-page.component.scss', './admin-logs.component.scss'],
})
export class AdminLogsComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    protected httpClient: HttpClient;
    protected urls: UrlService;
    protected dialog: MatDialog;
    protected signalrService: SignalRService;
    protected hubConnection: ConnectionContainer;
    protected filterSubject = new Subject<string>();
    protected destroy$ = new Subject<void>();
    filter = '';
    dataLoaded = false;
    logDisplayedColumns = ['timestamp', 'level', 'message'];
    datasource: MatTableDataSource<BasicLog> = new MatTableDataSource<BasicLog>();

    constructor(httpClient: HttpClient, urls: UrlService, dialog: MatDialog, signalrService: SignalRService, private clipboard: Clipboard) {
        this.httpClient = httpClient;
        this.urls = urls;
        this.dialog = dialog;
        this.signalrService = signalrService;
    }

    ngOnInit(): void {
        this.hubConnection = this.signalrService.connect(`admin`);
        this.hubConnection.connection.on('ReceiveLog', () => {
            this.refreshData();
        });
    }

    ngAfterViewInit(): void {
        this.paginator.page.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.refreshData();
            }
        });
        this.sort.sortChange.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.refreshData();
            }
        });
        this.filterSubject.pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.refreshData();
            }
        });
        this.refreshData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.hubConnection.connection.stop();
    }

    refreshData() {
        const params = this.buildParams();
        this.httpClient
            .get<PagedResult<BasicLog>>(`${this.urls.apiUrl}/logging/basic`, { params })
            .subscribe({
                next: (pagedResult: PagedResult<BasicLog>) => {
                    this.dataLoaded = true;
                    this.paginator.length = pagedResult.totalCount;
                    this.datasource.data = pagedResult.data;
                }
            });
    }

    applyFilter(filterValue: string) {
        this.filter = filterValue.trim().toLowerCase();
        this.filterSubject.next(this.filter);
    }

    openMessageDialog(message) {
        this.dialog.open(MessageModalComponent, {
            data: { message: message },
        });
    }

    copyToClipboard(text: string) {
        this.clipboard.copy(text);
    }

    buildParams(): HttpParams {
        return new HttpParams()
            .set('page', String(this.paginator.pageIndex + 1))
            .set('pageSize', String(this.paginator.pageSize))
            .set('sortDirection', String(this.sort.direction === 'asc' ? SortDirection.ASCENDING : SortDirection.DESCENDING))
            .set('sortField', this.sort.active === undefined ? 'timestamp' : this.sort.active)
            .set('filter', this.filter);
    }

    levelToString(level: LogLevel) {
        switch (level) {
            case LogLevel.DEBUG:
                return 'DEBUG';
            case LogLevel.INFO:
                return 'INFO';
            case LogLevel.WARNING:
                return 'WARNING';
            case LogLevel.ERROR:
                return 'ERROR';
        }
    }

    levelClass(level: LogLevel) {
        switch (level) {
            case LogLevel.ERROR:
                return 'log-level-error';
            case LogLevel.WARNING:
                return 'log-level-warning';
            default:
                return '';
        }
    }
}
