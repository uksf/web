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
    selector: 'app-admin-audit-logs',
    templateUrl: './admin-audit-logs.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.css', './admin-audit-logs.component.css']
})
export class AdminAuditLogsComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
    @ViewChild(MatSort, {static: true}) sort: MatSort;
    auditLogDisplayedColumns = ['id', 'timestamp', 'who', 'message'];
    datasource: MatTableDataSource<AuditLog>;
    private hubConnection: ConnectionContainer;
    private filter = '';

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private signalrService: SignalRService) {
        this.refreshData();
    }

    ngOnInit(): void {
        this.hubConnection = this.signalrService.connect(`admin`);
        this.hubConnection.connection.on('ReceiveAuditLog', (log) => {
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
        this.httpClient.get<AuditLog[]>(this.urls.apiUrl + '/logging?type=audit').subscribe(response => {
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

export interface AuditLog extends Log {
    who: string;
}
