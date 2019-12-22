import { Component, QueryList, ViewChildren } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog, MatExpansionPanel } from '@angular/material';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { ActivatedRoute } from '@angular/router';
import { TextInputModalComponent } from 'app/Modals/text-input-modal/text-input-modal.component';

@Component({
    selector: 'app-personnel-discharges',
    templateUrl: './personnel-discharges.component.html',
    styleUrls: ['../../../Pages/personnel-page/personnel-page.component.scss', './personnel-discharges.component.scss']
})
export class PersonnelDischargesComponent {
    @ViewChildren('dischargePanels') dischargePanels: QueryList<MatExpansionPanel>;
    displayedColumns = ['timestamp', 'rank', 'unit', 'role', 'dischargedBy', 'reason'];
    updating;
    completeDischargeCollections: DischargeCollection[];
    filtered: DischargeCollection[] = [];
    dischargeCollections: DischargeCollection[] = []
    index = 0;
    length = 15;
    lengths = [
        { 'value': 10, 'name': '10' },
        { 'value': 15, 'name': '15' },
        { 'value': 30, 'name': '30' }
    ];
    filterString = '';
    private timeout;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private route: ActivatedRoute) {
        if (this.route.snapshot.queryParams['filter']) {
            this.refresh(this.route.snapshot.queryParams['filter']);
        } else {
            this.refresh();
        }
    }

    refresh(initialFilter = '') {
        this.completeDischargeCollections = undefined;
        this.updating = true;
        this.httpClient.get<any[]>(this.urls.apiUrl + '/discharges').subscribe((response: DischargeCollection[]) => {
            this.completeDischargeCollections = response;
            if (initialFilter) {
                this.filterString = initialFilter;
                this.filter(true);
            } else {
                this.filtered = this.completeDischargeCollections;
                this.navigate(-1);
            }
            this.updating = false;
        }, _ => {
            this.updating = false;
        });
    }

    navigate(mode) {
        switch (mode) {
            case 0: // Previous
                this.index -= this.length;
                break;
            case 1: // Next
                this.index += this.length;
                break;
            default: // Don't navigate
                break;
        }
        this.dischargeCollections = this.filtered.slice(this.index, this.index + this.length);
    }

    filter(openFirst: boolean = false) {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.filtered = [];
            this.completeDischargeCollections.forEach(element => {
                if (String(element.name).toLowerCase().indexOf(this.filterString.toLowerCase()) !== -1) {
                    this.filtered.push(element);
                }
            });
            this.dischargeCollections = this.filtered.filter(n => this.filtered.includes(n));
            this.index = 0;
            this.navigate(-1);
            if (openFirst) {
                console.log(JSON.stringify(this.dischargePanels));
                this.dischargePanels.first.open();
            }
        }, 150);
    }

    openMessageDialog(message) {
        this.dialog.open(MessageModalComponent, {
            data: { message: message }
        });
    }

    reinstate(event: Event, dischargeCollection) {
        event.stopPropagation();
        this.httpClient.get<any[]>(this.urls.apiUrl + `/discharges/reinstate/${dischargeCollection.id}`).subscribe(response => {
            this.dischargeCollections = response;
        }, _ => {
            this.dialog.open(MessageModalComponent, {
                data: { message: `Failed to reinstate ${dischargeCollection.name} as a member` }
            });
        });
    }

    requestReinstate(event: Event, dischargeCollection) {
        event.stopPropagation();
        this.dialog.open(TextInputModalComponent, {
            data: { message: 'Please provide a reason for the reinstate request' }
        }).componentInstance.confirmEvent.subscribe((reason: string) => {
            this.httpClient.put(this.urls.apiUrl + '/commandrequests/create/reinstate', JSON.stringify({ recipient: dischargeCollection.accountId, reason: reason }), {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            }).subscribe(_ => {
                this.httpClient.post(this.urls.apiUrl + '/commandrequests/exists', JSON.stringify({ recipient: dischargeCollection.accountId, type: 'Reinstate Member', displayValue: 'Member', displayFrom: 'Discharged' }), {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json'
                    })
                }).subscribe(response => {
                    dischargeCollection.requestExists = response;
                });
            }, _ => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: `Failed to create request to reinstate ${dischargeCollection.name} as a member` }
                });
            });
        });
    }

    trackByDischargeCollection(_, dischargeCollection) {
        return dischargeCollection.accountId;
    }

    min(a, b) {
        return Math.min(a, b);
    }
}

export class DischargeCollection {
    public accountId: string;
    public discharges: Array<Discharge>;
    public id: string;
    public name: string;
    public reinstated: boolean;
}

export class Discharge {
    public dischargedBy: string;
    public id: string;
    public rank: string;
    public reason: string;
    public role: string;
    public timestamp: Date;
    public unit: string;
}
