import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Permissions } from '@app/core/services/permissions';
import { PermissionsService } from '@app/core/services/permissions.service';
import { PagedEvent, PaginatorComponent } from '@app/shared/components/elements/paginator/paginator.component';
import { buildQuery } from '@app/shared/services/helper.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PagedResult } from '@app/shared/models/PagedResult';
import { UrlService } from '@app/core/services/url.service';
import { Loa, LoaReviewState } from '@app/features/command/models/Loa';
import { expansionAnimations } from '@app/shared/services/animations.service';
import { DateMode, DateModeItem, ViewMode, ViewModeItem } from '../personnel-loas/personnel-loas.component';
import { Moment } from 'moment/moment';
import { UksfError } from '@app/shared/models/Response';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { MatDialog } from '@angular/material/dialog';

export type SelectionMode = 'current' | 'future' | 'past';

@Component({
    selector: 'app-personnel-loas-list',
    templateUrl: './personnel-loas-list.component.html',
    styleUrls: ['../personnel-page/personnel-page.component.scss', '../personnel-loas/personnel-loas.component.scss', './personnel-loas-list.component.scss'],
    animations: [expansionAnimations.indicatorRotate, expansionAnimations.bodyExpansion]
})
export class PersonnelLoasListComponent implements OnInit {
    @ViewChild(PaginatorComponent) paginator: PaginatorComponent;
    @Input() selectionMode: SelectionMode = 'current';
    @Input() viewMode: ViewMode = 'all';
    @Input() dateMode: DateMode = 'all';
    @Input() deletable: boolean = true;
    @Output() deleteEvent: EventEmitter<any> = new EventEmitter();
    loaded: boolean = false;
    loaReviewState = LoaReviewState;
    loas: Loa[] = [];
    totalLoas: number = 0;
    pageIndex: number = 0;
    pageSize: number = 15;
    filterString: string = '';
    selectedDate?: Moment;

    selectedIndex: number = -1;

    constructor(private httpClient: HttpClient, private urls: UrlService, private permissions: PermissionsService, private dialog: MatDialog) {}

    ngOnInit(): void {
        this.getLoas();
    }

    update(newDateMode: DateModeItem, newViewMode: ViewModeItem, filter: string, newSelectedDate?: Moment) {
        this.dateMode = newDateMode.mode;
        this.viewMode = newViewMode.mode;
        this.filterString = filter;
        this.selectedDate = newSelectedDate;
        this.getLoas();
    }

    getLoas() {
        const query: string = buildQuery(this.filterString);

        let httpParams: HttpParams = new HttpParams()
            .set('page', this.pageIndex + 1)
            .set('pageSize', this.pageSize)
            .set('query', query)
            .set('selectionMode', this.selectionMode)
            .set('dateMode', this.dateMode)
            .set('viewMode', this.viewMode);

        if (this.selectedDate) {
            httpParams = httpParams.set('selectedDate', this.selectedDate.toISOString());
        }

        this.httpClient
            .get(`${this.urls.apiUrl}/loa`, {
                params: httpParams
            })
            .subscribe({
                next: (pagedLoas: PagedResult<Loa>) => {
                    this.loaded = true;
                    this.selectedIndex = -1;
                    this.loas = pagedLoas.data;
                    this.totalLoas = pagedLoas.totalCount;
                },
                error: (error: UksfError) => {
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                    this.loaded = true;
                }
            });
    }

    page(pagedEvent: PagedEvent) {
        this.pageIndex = pagedEvent.pageIndex;
        this.pageSize = pagedEvent.pageSize;

        this.getLoas();
    }

    trackByLoa(loa) {
        return loa.id;
    }

    min(a, b) {
        return Math.min(a, b);
    }

    getExpandedState(loaIndex) {
        return loaIndex === this.selectedIndex ? 'expanded' : 'collapsed';
    }

    activate(loaIndex) {
        this.selectedIndex = this.selectedIndex === loaIndex ? -1 : loaIndex;
    }

    canViewReason(loa: Loa) {
        if (loa.inChainOfCommand) {
            return true;
        }

        return this.permissions.hasPermission(Permissions.NCO) || this.permissions.hasPermission(Permissions.COMMAND) || this.permissions.hasPermission(Permissions.RECRUITER);
    }

    canDelete(loa: Loa) {
        if (!this.deletable) {
            return false;
        }

        if (loa.inChainOfCommand) {
            return true;
        }

        return this.permissions.hasPermission(Permissions.PERSONNEL);
    }

    delete(loa: Loa) {
        this.deleteEvent.emit(loa);
    }
}
