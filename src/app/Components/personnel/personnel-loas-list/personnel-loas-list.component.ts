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
    @Input() deletable = true;
    @Output() deleteEvent = new EventEmitter();
    loaded: boolean = false;
    loaReviewState = LoaReviewState;
    loas: Loa[] = [];
    totalLoas: number = 0;
    pageIndex: number = 0;
    pageSize: number = 15;
    filterString: string = '';

    selectedIndex = -1;

    constructor(private httpClient: HttpClient, private urls: UrlService, private permissions: PermissionsService) {}

    ngOnInit(): void {
        this.getLoas();
    }

    update(viewMode: string, filter: string) {
        this.viewMode = viewMode;
        this.filterString = filter;
        this.getLoas();
    }

    getLoas() {
        const query = buildQuery(this.filterString);

        this.httpClient
            .get(`${this.urls.apiUrl}/loa`, {
                params: new HttpParams()
                    .set('page', this.pageIndex + 1)
                    .set('pageSize', this.pageSize)
                    .set('query', query)
                    .set('selectionMode', this.selectionMode)
                    .set('viewMode', this.viewMode)
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
