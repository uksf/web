import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material';
import { RequestLoaModalComponent } from '../../../Modals/command/request-loa-modal/request-loa-modal.component';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { EventEmitter } from 'events';
import { formatDate } from '@angular/common';

@Component({
    selector: 'app-personnel-loas',
    templateUrl: './personnel-loas.component.html',
    styleUrls: ['../../../Pages/personnel-page/personnel-page.component.scss', './personnel-loas.component.scss']
})
export class PersonnelLoasComponent implements OnInit {
    activeLoas = new Array<Loa>();
    upcomingLoas = new Array<Loa>();
    pastLoas = new Array<Loa>();
    filterEvent = new EventEmitter();
    mode = 'all';
    filterString = '';
    filterValue;
    private timeout: NodeJS.Timeout;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) { }

    ngOnInit() {
        this.getLOAs();
    }

    getLOAs(mode = 'all') {
        this.httpClient.get<Loa>(this.urls.apiUrl + '/loa?scope=' + mode).subscribe(result => {
            this.activeLoas = result['activeLoas'];
            this.upcomingLoas = result['upcomingLoas'];
            this.pastLoas = result['pastLoas'];
            this.mode = mode;
        });
    }

    filter() {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.filterString = this.filterValue;
        }, 150);
    }

    createLoa() {
        this.dialog.open(RequestLoaModalComponent, {}).afterClosed().subscribe(_ => {
            this.getLOAs();
        });
    }

    delete(loa: Loa) {
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete LOA for '${loa.name}' from '${formatDate(loa.start, 'd MMM y', 'en-GB', '+0000')}' to '${formatDate(loa.end, 'd MMM y', 'en-GB', '+0000')}'?` }
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.httpClient.delete(`${this.urls.apiUrl}/loa/${loa.id}`).subscribe(_ => {
                this.getLOAs();
            });
        });
    }
}

export interface Loa {
    id: string;
    start: Date;
    end: Date;
    state: LoaReviewState;
    reason: string;
    emergency: boolean;
    late: boolean;
    name: string;
    inChainOfCommand: boolean;
    longTerm: boolean;
}

export enum LoaReviewState {
    PENDING,
    APPROVED,
    REJECTED
}
