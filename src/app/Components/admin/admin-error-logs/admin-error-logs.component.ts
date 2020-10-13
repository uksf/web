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
    selector: 'app-admin-error-logs',
    templateUrl: './admin-error-logs.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.css', './admin-error-logs.component.css']
})
export class AdminErrorLogsComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
    @ViewChild(MatSort, {static: true}) sort: MatSort;
    errorLogDisplayedColumns = ['id', 'timestamp', 'message', 'exception', 'httpMethod', 'url', 'userId', 'name'];
    datasource: MatTableDataSource<ErrorLog>;
    private hubConnection: ConnectionContainer;
    private filter = '';

    constructor(private httpClient: HttpClient, private urls: UrlService, private signalrService: SignalRService, private dialog: MatDialog) {
        this.refreshData();
    }

    ngOnInit(): void {
        this.hubConnection = this.signalrService.connect(`admin`);
        this.hubConnection.connection.on('ReceiveErrorLog', (log) => {
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
        this.httpClient.get<ErrorLog[]>(this.urls.apiUrl + '/logging?type=error').subscribe(response => {
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

export interface ErrorLog extends Log {
    exception: string
    httpMethod: string;
    url: string;
    userId: string;
    name: string;
}
