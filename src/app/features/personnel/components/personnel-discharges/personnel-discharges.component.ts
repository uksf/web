import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { TextInputModalComponent } from '@app/shared/modals/text-input-modal/text-input-modal.component';
import { DischargesService } from '../../services/discharges.service';
import { CommandRequestsService, CommandRequestExistsBody } from '@app/features/command/services/command-requests.service';
import { expansionAnimations } from '@app/shared/services/animations.service';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { NgClass, DatePipe } from '@angular/common';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { FormsModule } from '@angular/forms';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/autocomplete';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatAccordion } from '@angular/material/expansion';
import { MatCard } from '@angular/material/card';
import { SpotlightDirective } from '../../../../shared/directives/spotlight.directive';
import { MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { NgxPermissionsModule } from 'ngx-permissions';

@Component({
    selector: 'app-personnel-discharges',
    templateUrl: './personnel-discharges.component.html',
    styleUrls: ['../personnel-page/personnel-page.component.scss', './personnel-discharges.component.scss'],
    animations: [expansionAnimations.indicatorRotate, expansionAnimations.bodyExpansionState],
    imports: [
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        MatButton,
        MatTooltip,
        MatIcon,
        NgClass,
        TextInputComponent,
        FormsModule,
        FlexFillerComponent,
        MatSelect,
        MatOption,
        MatProgressSpinner,
        MatAccordion,
        MatCard,
        SpotlightDirective,
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        NgxPermissionsModule,
        DatePipe
    ]
})
export class PersonnelDischargesComponent implements OnInit, OnDestroy {
    private dischargesService = inject(DischargesService);
    private commandRequestsService = inject(CommandRequestsService);
    private dialog = inject(MatDialog);
    private route = inject(ActivatedRoute);

    displayedColumns = ['timestamp', 'rank', 'unit', 'role', 'dischargedBy', 'reason'];
    selectedIndex = -1;
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
    pendingActions = new Set<string>();
    private timeout: number;

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
        this.dischargesService
            .getDischarges()
            .pipe(first())
            .subscribe({
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
        this.selectedIndex = -1;
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
                this.selectedIndex = 0;
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
        this.pendingActions.add(dischargeCollection.id);
        this.dischargesService
            .reinstateDischarge(dischargeCollection.id)
            .pipe(first())
            .subscribe({
                next: (response: DischargeCollection[]) => {
                    this.pendingActions.delete(dischargeCollection.id);
                    this.dischargeCollections = response;
                },
                error: (_) => {
                    this.pendingActions.delete(dischargeCollection.id);
                    this.dialog.open(MessageModalComponent, {
                        data: { message: `Failed to reinstate ${dischargeCollection.name} as a member` }
                    });
                }
            });
    }

    requestReinstate(event: Event, dischargeCollection: DischargeCollection) {
        event.stopPropagation();
        this.pendingActions.add(dischargeCollection.id);
        this.dialog
            .open(TextInputModalComponent, {
                data: { title: 'Reinstate Request' }
            })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (reason: string) => {
                    if (!reason) {
                        this.pendingActions.delete(dischargeCollection.id);
                        return;
                    }
                    this.commandRequestsService
                        .createReinstate({ recipient: dischargeCollection.accountId, reason: reason })
                        .pipe(first())
                        .subscribe({
                            next: (_) => {
                                this.pendingActions.delete(dischargeCollection.id);
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
                                this.pendingActions.delete(dischargeCollection.id);
                                this.dialog.open(MessageModalComponent, {
                                    data: { message: `Failed to create request to reinstate ${dischargeCollection.name} as a member` }
                                });
                            }
                        });
                }
            });
    }

    getExpandedState(index: number): string {
        return index === this.selectedIndex ? 'expanded' : 'collapsed';
    }

    activate(index: number): void {
        this.selectedIndex = this.selectedIndex === index ? -1 : index;
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
    public discharges: Discharge[];
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
