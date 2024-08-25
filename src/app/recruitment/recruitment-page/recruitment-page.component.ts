import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { Router } from '@angular/router';
import { AccountService } from '../../Services/account.service';
import { AccountSettings, MembershipState } from '../../Models/Account';
import { ActiveApplication, ApplicationState, CompletedApplication, Recruiter } from '../../Models/Application';
import { AsyncSubject, Subject } from 'rxjs';
import { OnlineState } from '../../Models/OnlineState';
import { Dictionary } from '../../Models/Dictionary';
import { ThemeEmitterComponent } from '../../Components/elements/theme-emitter/theme-emitter.component';
import { buildQuery } from '../../Services/helper.service';
import { PagedResult } from '../../Models/PagedResult';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PagedEvent } from '../../Components/elements/paginator/paginator.component';

@Component({
    selector: 'app-recruitment-page',
    templateUrl: './recruitment-page.component.html',
    styleUrls: ['./recruitment-page.component.scss']
})
export class RecruitmentPageComponent implements OnInit {
    @ViewChild(ThemeEmitterComponent) theme: ThemeEmitterComponent;
    membershipState = MembershipState;
    applicationState = ApplicationState;
    userActiveApplications: ActiveApplication[] = [];
    allOtherActiveApplications: ActiveApplication[] = [];
    completedApplications: CompletedApplication[] = [];
    recruiters: Recruiter[];
    activity: any[] = [];
    yourStats;
    sr1Stats;
    teamspeakStates: Dictionary<AsyncSubject<OnlineState>> = new Dictionary<AsyncSubject<OnlineState>>();
    loaded: boolean = false;
    totalCompletedApplications: number = 0;
    pageIndex: number = 0;
    pageSize: number = 15;
    filterString: string = '';
    recruiterIdFilter: string = '';
    sortMode: string = 'dateCompleted';
    sortDirection: number = -1;
    sortDefinitions: { mode: string; name: string; direction: number }[] = [
        { mode: 'name', direction: 1, name: 'Name (A - Z)' },
        { mode: 'name', direction: -1, name: 'Name (Z - A)' },
        { mode: 'dateApplied', direction: -1, name: 'Date Applied (New - Old)' },
        { mode: 'dateApplied', direction: 1, name: 'Date Applied (Old - New)' },
        { mode: 'dateCompleted', direction: -1, name: 'Date Completed (New - Old)' },
        { mode: 'dateCompleted', direction: 1, name: 'Date Completed (Old - New)' }
    ];
    private filterSubject: Subject<string> = new Subject<string>();

    constructor(private accountService: AccountService, private httpClient: HttpClient, private urls: UrlService, private router: Router) {}

    ngOnInit() {
        this.httpClient.get(this.urls.apiUrl + '/recruitment/applications/active').subscribe((applications: ActiveApplication[]) => {
            this.userActiveApplications = applications.filter((x: ActiveApplication) => x.account.application.recruiter === this.accountService.account.id);
            this.allOtherActiveApplications = applications.filter((x: ActiveApplication) => !this.userActiveApplications.includes(x));
            this.getTeamspeakOnlineStates();
        });
        this.httpClient.get(this.urls.apiUrl + '/recruitment/recruiters').subscribe((recruiters: Recruiter[]) => {
            this.recruiters = recruiters;
        });

        this.getCompletedApplications();
        this.getStats();

        this.filterSubject.pipe(debounceTime(150), distinctUntilChanged()).subscribe(() => {
            this.getCompletedApplications();
        });
    }

    getUserAccount() {
        return this.accountService.account;
    }

    getApplicationColour(application: ActiveApplication) {
        return application.processingDifference < 0
            ? 'green'
            : application.processingDifference > 10
            ? 'red'
            : application.processingDifference > 7
            ? 'orange'
            : application.processingDifference > 5
            ? 'goldenrod'
            : this.theme.foregroundColor;
    }

    setSr1Enabled(recruiter) {
        this.httpClient.put(`${this.urls.apiUrl}/accounts/${recruiter.account.id}/updatesetting`, recruiter.account.settings).subscribe((settings: AccountSettings) => {
            recruiter.account.settings = settings;
        });
    }

    setAccountSr1Enabled() {
        this.accountService.account.settings.sr1Enabled = !this.accountService.account.settings.sr1Enabled;

        this.httpClient.put(`${this.urls.apiUrl}/accounts/${this.accountService.account.id}/updatesetting`, this.accountService.account.settings).subscribe((settings: AccountSettings) => {
            const recruiter: any = this.activity.find((x: any) => x.account.id === this.accountService.account.id);
            if (recruiter !== undefined) {
                recruiter.account.settings = settings;
            }
        });
    }

    openApplication(application: ActiveApplication | CompletedApplication) {
        this.router.navigate(['/recruitment', application.account.id]);
    }

    page(pagedEvent: PagedEvent) {
        this.pageIndex = pagedEvent.pageIndex;
        this.pageSize = pagedEvent.pageSize;

        this.getCompletedApplications();
    }

    filter() {
        this.filterSubject.next(this.filterString);
    }

    sort(mode: string, direction: number) {
        this.sortMode = mode;
        this.sortDirection = direction;

        this.getCompletedApplications();
    }

    filterByRecruiter(recruiterId: string) {
        this.recruiterIdFilter = recruiterId;

        this.getCompletedApplications();
    }

    getHistoryColour(application: CompletedApplication): 'goldenrod' | 'green' | 'red' {
        return application.account.application.state !== this.applicationState.WAITING && application.account.membershipState === this.membershipState.DISCHARGED
            ? 'goldenrod'
            : application.account.application.state === this.applicationState.ACCEPTED
            ? 'green'
            : 'red';
    }

    trackByApplication(_: any, application: CompletedApplication) {
        return application.account.id;
    }

    private getCompletedApplications() {
        const query: string = buildQuery(this.filterString);
        let pageIndex: number = this.pageIndex;
        let pageSize: number = this.pageSize;

        this.httpClient
            .get(`${this.urls.apiUrl}/recruitment/applications/completed`, {
                params: new HttpParams()
                    .set('page', pageIndex + 1)
                    .set('pageSize', pageSize)
                    .set('query', query)
                    .set('sortMode', this.sortMode)
                    .set('sortDirection', this.sortDirection)
                    .set('recruiterId', this.recruiterIdFilter)
            })
            .subscribe({
                next: (pagedMembers: PagedResult<CompletedApplication>) => {
                    this.loaded = true;
                    this.completedApplications = pagedMembers.data;
                    this.totalCompletedApplications = pagedMembers.totalCount;
                },
                error: () => {
                    this.loaded = true;
                }
            });
    }

    private getTeamspeakOnlineStates() {
        let applications: ActiveApplication[] = this.userActiveApplications.concat(this.allOtherActiveApplications);
        for (const application of applications) {
            let teamspeakState: AsyncSubject<OnlineState> = new AsyncSubject<OnlineState>();
            this.teamspeakStates.Add(application.account.id, teamspeakState);

            this.httpClient.get(`${this.urls.apiUrl}/teamspeak/${application.account.id}/onlineUserDetails`).subscribe((state: OnlineState) => {
                teamspeakState.next(state);
                teamspeakState.complete();
            });
        }
    }

    private getStats() {
        this.httpClient.get(this.urls.apiUrl + '/recruitment/stats').subscribe((response: Object) => {
            this.activity = response['activity'];
            this.yourStats = response['yourStats'];
            this.sr1Stats = response['sr1Stats'];
        });
    }
}
