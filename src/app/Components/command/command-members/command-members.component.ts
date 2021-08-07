import {Component, OnInit, ViewChild} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {UrlService} from '../../../Services/url.service';
import {PagedResult} from '../../../Models/PagedResult';
import {PagedEvent, PaginatorComponent} from '../../elements/paginator/paginator.component';
import {Unit, UnitTreeDataSet} from '../../../Models/Units';
import {Account} from '../../../Models/Account';
import {buildQuery} from '../../../Services/helper.service';
import {CommandUnitGroupCardComponent} from './command-unit-group-card/command-unit-group-card.component';
import {SignalRHubsService} from '../../../Services/signalrHubs.service';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

@Component({
    selector: 'app-command-members',
    templateUrl: './command-members.component.html',
    styleUrls: ['./command-members.component.scss']
})
export class CommandMembersComponent implements OnInit {
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

    constructor(private httpClient: HttpClient, private urls: UrlService, private signalrHubsService: SignalRHubsService) {}

    ngOnInit(): void {
        this.signalrHubsService.getAllHub().then((allHub) => {
            allHub.connection.on('ReceiveAccountUpdate', () => {
                this.getMembers();
            });
            allHub.reconnectEvent.subscribe(() => {
                this.getMembers();
            });
        });

        this.getMembers();

        this.httpClient.get(`${this.urls.apiUrl}/units/tree`).subscribe({
            next: (unitTreeDataset: UnitTreeDataSet) => {
                this.unitRoot = unitTreeDataset.combatNodes[0];
            }
        });

        this.filterSubject.pipe(debounceTime(150), distinctUntilChanged()).subscribe(() => {
            this.getMembers();
        });
    }

    getMembers() {
        const query = buildQuery(this.filterString);

        this.httpClient
            .get(`${this.urls.apiUrl}/command/members`, {
                params: new HttpParams()
                    .set('page', this.pageIndex + 1)
                    .set('pageSize', this.pageSize)
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

        if (this.groupByUnit) {
            this.pageIndex = 0;
            this.pageSize = 100;
        } else {
            this.pageIndex = this.paginator.pageIndex;
            this.pageSize = this.paginator.pageSize;
        }

        this.getMembers();
    }

    groupByUnits() {
        this.setUnitMembers(this.unitRoot);
    }

    trackByMemberId(_: any, member: Account) {
        return member.id;
    }

    private setUnitMembers(unit: Unit) {
        unit.memberObjects = this.members.filter((member) => member.unitObject.id === unit.id);

        unit.children.forEach((child) => this.setUnitMembers(child));
    }
}
