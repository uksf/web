import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { PagedResult } from '@app/Models/PagedResult';
import { PagedEvent, PaginatorComponent } from '@app/shared/components/elements/paginator/paginator.component';
import { Unit, UnitTreeDataSet } from '@app/Models/Units';
import { Account } from '@app/Models/Account';
import { buildQuery } from '@app/Services/helper.service';
import { CommandUnitGroupCardComponent } from './command-unit-group-card/command-unit-group-card.component';
import { SignalRHubsService } from '@app/Services/signalrHubs.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-command-members',
    templateUrl: './command-members.component.html',
    styleUrls: ['./command-members.component.scss']
})
export class CommandMembersComponent implements OnInit, OnDestroy {
    @ViewChild(PaginatorComponent) paginator: PaginatorComponent;
    @ViewChild(CommandUnitGroupCardComponent) unitGroupsRoot: CommandUnitGroupCardComponent;
    loaded: boolean = false;
    members: Account[] = [];
    unitRoot: Unit;
    totalMembers: number = 0;
    pageIndex: number = 0;
    pageSize: number = 15;
    filterString: string = '';
    sortMode: string = 'name';
    sortDirection: number = 1;
    sortDefinitions = [
        { mode: 'name', direction: 1, name: 'Name (A - Z)' },
        { mode: 'name', direction: -1, name: 'Name (Z - A)' },
        { mode: 'rank', direction: 1, name: 'Rank (High - Low)' },
        { mode: 'rank', direction: -1, name: 'Rank (Low - High)' },
        { mode: 'role', direction: 1, name: 'Role (A - Z)' },
        { mode: 'role', direction: -1, name: 'Role (Z - A)' }
    ];
    groupByUnit: boolean = false;
    showUnitGroups: boolean = false;
    groupsExpanded: boolean = true;
    viewModes = [
        { mode: 'all', name: 'All', icon: 'people_outline' },
        { mode: 'coc', name: 'My CoC', icon: 'people' },
        { mode: 'unit', name: 'My Unit', icon: 'person' }
    ];
    viewMode: string = 'all';
    private filterSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    constructor(private httpClient: HttpClient, private urls: UrlService, private signalrHubsService: SignalRHubsService) {}

    ngOnInit(): void {
        this.signalrHubsService.getAllHub().then((allHub) => {
            allHub.connection.on('ReceiveAccountUpdate', () => {
                this.getMembers();
            });
            allHub.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
                next: () => {
                    this.getMembers();
                }
            });
        });

        this.getMembers();

        this.httpClient.get(`${this.urls.apiUrl}/units/tree`).subscribe({
            next: (unitTreeDataset: UnitTreeDataSet) => {
                this.unitRoot = unitTreeDataset.combatNodes[0];
            }
        });

        this.filterSubject.pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getMembers();
            }
        });
    }

    getMembers() {
        const query = buildQuery(this.filterString);
        let pageIndex = this.pageIndex;
        let pageSize = this.pageSize;
        if (this.groupByUnit) {
            pageIndex = 0;
            pageSize = 500;
        }

        this.httpClient
            .get(`${this.urls.apiUrl}/command/members`, {
                params: new HttpParams()
                    .set('page', pageIndex + 1)
                    .set('pageSize', pageSize)
                    .set('query', query)
                    .set('sortMode', this.sortMode)
                    .set('sortDirection', this.sortDirection)
                    .set('viewMode', this.viewMode)
            })
            .subscribe({
                next: (pagedMembers: PagedResult<Account>) => {
                    this.loaded = true;
                    this.members = pagedMembers.data;
                    this.totalMembers = pagedMembers.totalCount;

                    if (this.groupByUnit) {
                        this.groupByUnits();
                    }

                    this.showUnitGroups = this.groupByUnit;
                },
                error: () => {
                    this.loaded = true;
                }
            });
    }

    page(pagedEvent: PagedEvent) {
        this.pageIndex = pagedEvent.pageIndex;
        this.pageSize = pagedEvent.pageSize;

        this.getMembers();
    }

    filter() {
        this.filterSubject.next(this.filterString);
    }

    sort(mode: string, direction: number) {
        this.sortMode = mode;
        this.sortDirection = direction;

        this.getMembers();
    }

    changeViewMode(mode: string) {
        this.viewMode = mode;

        this.getMembers();
    }

    toggleGroupByUnit() {
        this.groupByUnit = !this.groupByUnit;

        this.getMembers();
    }

    groupByUnits() {
        this.setUnitMembers(this.unitRoot);
    }

    trackByMemberId(_: any, member: Account) {
        return member.id;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setUnitMembers(unit: Unit) {
        unit.memberObjects = this.members.filter((member) => member.unitObject.id === unit.id);

        unit.children.forEach((child) => this.setUnitMembers(child));
    }
}
