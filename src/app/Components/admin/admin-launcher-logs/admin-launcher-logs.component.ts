import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { Log } from '../../../Pages/admin-page/admin-page.component';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { SignalRService, ConnectionContainer } from 'app/Services/signalr.service';

@Component({
    selector: 'app-admin-launcher-logs',
    templateUrl: './admin-launcher-logs.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.css', './admin-launcher-logs.component.css']
})
export class AdminLauncherLogsComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
    @ViewChild(MatSort, {static: true}) sort: MatSort;
    launcherLogDisplayedColumns = ['id', 'timestamp', 'userId', 'name', 'version', 'message'];
    datasource: MatTableDataSource<LauncherLog>;
    private hubConnection: ConnectionContainer;
    private filter = '';

    constructor(private httpClient: HttpClient, private urls: UrlService, private signalrService: SignalRService, private dialog: MatDialog) {
        this.refreshData();
    }

    ngOnInit(): void {
        this.hubConnection = this.signalrService.connect(`admin`);
        this.hubConnection.connection.on('ReceiveLauncherLog', (log) => {
            this.datasource.data.unshift(log);
            this.datasource = new MatTableDataSource(this.datasource.data);
            this.datasource.paginator = this.paginator;
            this.datasource.sort = this.sort;
            this.datasource.filter = this.filter;
        });
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.refreshData();
        });
    }

    ngOnDestroy(): void {
        this.hubConnection.connection.stop();
    }

    refreshData() {
        this.httpClient.get<LauncherLog[]>(this.urls.apiUrl + '/logging?type=launcher').subscribe(response => {
            this.datasource = new MatTableDataSource(response);
            this.datasource.paginator = this.paginator;
            this.datasource.sort = this.sort;
            this.datasource.filter = this.filter;
        });
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.filter = filterValue;
        this.datasource.filter = this.filter;
    }

    openMessageDialog(message) {
        this.dialog.open(MessageModalComponent, {
            data: { message: message }
        });
    }
}

export interface LauncherLog extends Log {
    version: string
    userId: string;
    name: string;
}
