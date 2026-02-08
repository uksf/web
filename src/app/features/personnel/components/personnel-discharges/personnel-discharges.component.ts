import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatExpansionPanel } from '@angular/material/expansion';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { TextInputModalComponent } from '@app/shared/modals/text-input-modal/text-input-modal.component';
import { nextFrame } from '@app/shared/services/helper.service';
import { DischargesService } from '../../services/discharges.service';
import { CommandRequestsService, CommandRequestExistsBody } from '@app/features/command/services/command-requests.service';

@Component({
    selector: 'app-personnel-discharges',
    templateUrl: './personnel-discharges.component.html',
    styleUrls: ['../personnel-page/personnel-page.component.scss', './personnel-discharges.component.scss']
})
export class PersonnelDischargesComponent implements OnInit, OnDestroy {
    @ViewChild(MatExpansionPanel) panel: MatExpansionPanel;
    displayedColumns = ['timestamp', 'rank', 'unit', 'role', 'dischargedBy', 'reason'];
    updating: boolean;
    completeDischargeCollections: DischargeCollection[];
    filtered: DischargeCollection[] = [];
    dischargeCollections: DischargeCollection[] = [];
    index = 0;
    length = 15;
    lengths = [
        { value: 10, name: '10' },
        { value: 15, name: '15' },
        { value: 30, name: '30' }
    ];
    filterString = '';
    private timeout: number;

    constructor(
        private dischargesService: DischargesService,
        private commandRequestsService: CommandRequestsService,
        private dialog: MatDialog,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        if (this.route.snapshot.queryParams['filter']) {
            this.refresh(this.route.snapshot.queryParams['filter']);
        } else {
            this.refresh();
        }
    }

    ngOnDestroy(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    refresh(initialFilter = '') {
        this.completeDischargeCollections = undefined;
        this.updating = true;
        this.dischargesService.getDischarges().pipe(first()).subscribe({
            next: (response: DischargeCollection[]) => {
                this.completeDischargeCollections = response;
                if (initialFilter) {
                    this.filterString = initialFilter;
                    this.filter(true);
                } else {
                    this.filtered = this.completeDischargeCollections;
                    this.navigate(-1);
                }
                this.updating = false;
            },
            error: (_) => {
                this.updating = false;
            }
        });
    }

    navigate(mode: number) {
        switch (mode) {
            case 0: // Previous
                this.index -= this.length;
                break;
            case 1: // Next
                this.index += this.length;
                break;
            default:
                // Don't navigate
                break;
        }
        this.dischargeCollections = this.filtered.slice(this.index, this.index + this.length);
    }

    filter(openFirst: boolean = false) {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.filtered = [];
            this.completeDischargeCollections.forEach((element) => {
                if (element.name.toLowerCase().indexOf(this.filterString.toLowerCase()) !== -1) {
                    this.filtered.push(element);
                }
            });
            this.dischargeCollections = this.filtered.filter((n) => this.filtered.includes(n));
            this.index = 0;
            this.navigate(-1);
            if (openFirst) {
                nextFrame(() => {
                    this.panel.open();
                });
            }
        }, 150);
    }

    openMessageDialog(message: string) {
        this.dialog.open(MessageModalComponent, {
            data: { message: message }
        });
    }

    reinstate(event: Event, dischargeCollection: DischargeCollection) {
        event.stopPropagation();
        this.dischargesService.reinstateDischarge(dischargeCollection.id).pipe(first()).subscribe({
            next: (response: DischargeCollection[]) => {
                this.dischargeCollections = response;
            },
            error: (_) => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: `Failed to reinstate ${dischargeCollection.name} as a member` }
                });
            }
        });
    }

    requestReinstate(event: Event, dischargeCollection: DischargeCollection) {
        event.stopPropagation();
        this.dialog
            .open(TextInputModalComponent, {
                data: { message: 'Please provide a reason for the reinstate request' }
            })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (reason: string) => {
                    if (!reason) {
                        return;
                    }
                    this.commandRequestsService
                        .createReinstate({ recipient: dischargeCollection.accountId, reason: reason })
                        .pipe(first())
                        .subscribe({
                            next: (_) => {
                                const body: CommandRequestExistsBody = {
                                    recipient: dischargeCollection.accountId,
                                    type: 'Reinstate Member',
                                    displayValue: 'Member',
                                    displayFrom: 'Discharged'
                                };
                                this.commandRequestsService
                                    .checkExists(body)
                                    .pipe(first())
                                    .subscribe({
                                        next: (response: boolean) => {
                                            dischargeCollection.requestExists = response;
                                        }
                                    });
                            },
                            error: (_) => {
                                this.dialog.open(MessageModalComponent, {
                                    data: { message: `Failed to create request to reinstate ${dischargeCollection.name} as a member` }
                                });
                            }
                        });
                }
            });
    }

    trackByDischargeCollection(_: number, dischargeCollection: DischargeCollection) {
        return dischargeCollection.accountId;
    }

    min(a: number, b: number) {
        return Math.min(a, b);
    }
}

export class DischargeCollection {
    public accountId: string;
    public discharges: Array<Discharge>;
    public id: string;
    public name: string;
    public reinstated: boolean;
    public requestExists = false;
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
