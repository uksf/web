import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Permissions } from 'app/Services/permissions';
import { PermissionsService } from 'app/Services/permissions.service';
import { PagedEvent, PaginatorComponent } from '../../elements/paginator/paginator.component';
import { buildQuery } from '../../../Services/helper.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PagedResult } from '../../../Models/PagedResult';
import { UrlService } from '../../../Services/url.service';
import { Loa, LoaReviewState } from '../../../Models/Loa';
import { expansionAnimations } from '../../../Services/animations.service';
import { ModeItem } from '../personnel-loas/personnel-loas.component';
import { Moment } from 'moment/moment';

@Component({
    selector: 'app-personnel-loas-list',
    templateUrl: './personnel-loas-list.component.html',
    styleUrls: ['../../../Pages/personnel-page/personnel-page.component.scss', '../personnel-loas/personnel-loas.component.scss', './personnel-loas-list.component.scss'],
    animations: [expansionAnimations.indicatorRotate, expansionAnimations.bodyExpansion]
})
export class PersonnelLoasListComponent implements OnInit {
    @ViewChild(PaginatorComponent) paginator: PaginatorComponent;
    @Input() selectionMode: string;
    @Input() viewMode: string = 'all';
    @Input() dateMode: string = 'all';
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

    constructor(private httpClient: HttpClient, private urls: UrlService, private permissions: PermissionsService) {}

    ngOnInit(): void {
        this.getLoas();
    }

    update(newDateMode: ModeItem, newViewMode: ModeItem, filter: string, newSelectedDate?: Moment) {
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
                error: () => {
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
