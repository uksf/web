import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { RecruitmentService, RecruiterActivity, RecruitmentStats } from '../../services/recruitment.service';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { AccountService } from '@app/core/services/account.service';
import { AccountSettings, MembershipState } from '@app/shared/models/account';
import { ActiveApplication, ApplicationState, CompletedApplication, Recruiter } from '@app/features/application/models/application';
import { AsyncSubject, Subject } from 'rxjs';
import { OnlineState } from '@app/shared/models/online-state';
import { Dictionary } from '@app/shared/models/dictionary';
import { ThemeEmitterComponent } from '@app/shared/components/elements/theme-emitter/theme-emitter.component';
import { buildQuery } from '@app/shared/services/helper.service';
import { debounceTime, distinctUntilChanged, first, takeUntil } from 'rxjs/operators';
import { PagedEvent } from '@app/shared/components/elements/paginator/paginator.component';
import { DestroyableComponent } from '@app/shared/components';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { ThemeEmitterComponent as ThemeEmitterComponent_1 } from '../../../../shared/components/elements/theme-emitter/theme-emitter.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatCard } from '@angular/material/card';
import { SpotlightDirective } from '../../../../shared/directives/spotlight.directive';
import { NgStyle, NgClass, AsyncPipe, DatePipe } from '@angular/common';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { PaginatorComponent } from '../../../../shared/components/elements/paginator/paginator.component';
import { SideContentAreaComponent } from '../../../../shared/components/content-areas/side-content-area/side-content-area.component';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { ApplicationFunnelComponent } from '../application-funnel/application-funnel.component';

@Component({
    selector: 'app-recruitment-page',
    templateUrl: './recruitment-page.component.html',
    styleUrls: ['./recruitment-page.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        ThemeEmitterComponent_1,
        MainContentAreaComponent,
        MatCard,
        SpotlightDirective,
        NgStyle,
        TextInputComponent,
        FormsModule,
        MatButton,
        MatMenuTrigger,
        MatIcon,
        MatMenu,
        MatMenuItem,
        PaginatorComponent,
        NgClass,
        SideContentAreaComponent,
        NgxPermissionsModule,
        MatCheckbox,
        MatTooltip,
        MatTabGroup,
        MatTab,
        AsyncPipe,
        DatePipe,
        ApplicationFunnelComponent
    ]
})
export class RecruitmentPageComponent extends DestroyableComponent implements OnInit {
    private accountService = inject(AccountService);
    private recruitmentService = inject(RecruitmentService);
    private profileService = inject(ProfileService);
    private router = inject(Router);

    @ViewChild(ThemeEmitterComponent) theme: ThemeEmitterComponent;
    membershipState = MembershipState;
    applicationState = ApplicationState;
    userActiveApplications: ActiveApplication[] = [];
    allOtherActiveApplications: ActiveApplication[] = [];
    completedApplications: CompletedApplication[] = [];
    recruiters: Recruiter[];
    activity: RecruiterActivity[] = [];
    yourStats: RecruitmentStats;
    sr1Stats: RecruitmentStats;
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

    ngOnInit() {
        this.recruitmentService
            .getActiveApplications()
            .pipe(first())
            .subscribe({
                next: (applications) => {
                    this.userActiveApplications = applications.filter((x: ActiveApplication) => x.account.application.recruiter === this.accountService.account.id);
                    this.allOtherActiveApplications = applications.filter((x: ActiveApplication) => !this.userActiveApplications.includes(x));
                    this.updateApplicationColours();
                    this.getTeamspeakOnlineStates();
                }
            });
        this.recruitmentService
            .getRecruiters()
            .pipe(first())
            .subscribe({
                next: (recruiters) => {
                    this.recruiters = recruiters;
                }
            });

        this.getCompletedApplications();
        this.getStats();

        this.filterSubject.pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getCompletedApplications();
            }
        });
    }

    getUserAccount() {
        return this.accountService.account;
    }

    updateApplicationColours() {
        const foreground = this.theme?.foregroundColor ?? '';
        [...this.userActiveApplications, ...this.allOtherActiveApplications].forEach((app) => {
            app._colour =
                app.processingDifference < 0 ? 'green' : app.processingDifference > 10 ? 'red' : app.processingDifference > 7 ? 'orange' : app.processingDifference > 5 ? 'goldenrod' : foreground;
        });
    }

    setSr1Enabled(recruiter) {
        this.profileService
            .updateSetting(recruiter.account.id, recruiter.account.settings)
            .pipe(first())
            .subscribe({
                next: (settings: AccountSettings) => {
                    recruiter.account.settings = settings;
                }
            });
    }

    setAccountSr1Enabled() {
        this.accountService.account.settings.sr1Enabled = !this.accountService.account.settings.sr1Enabled;

        this.profileService
            .updateSetting(this.accountService.account.id, this.accountService.account.settings)
            .pipe(first())
            .subscribe({
                next: (settings: AccountSettings) => {
                    const recruiter = this.activity.find((x) => x.account.id === this.accountService.account.id);
                    if (recruiter !== undefined) {
                        recruiter.account.settings = settings;
                    }
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

    trackByActiveApplication(_: number, application: ActiveApplication) {
        return application.account.id;
    }

    trackByApplication(_: number, application: CompletedApplication) {
        return application.account.id;
    }

    private getCompletedApplications() {
        const query: string = buildQuery(this.filterString);
        const pageIndex: number = this.pageIndex;
        const pageSize: number = this.pageSize;

        const params = new HttpParams()
            .set('page', pageIndex + 1)
            .set('pageSize', pageSize)
            .set('query', query)
            .set('sortMode', this.sortMode)
            .set('sortDirection', this.sortDirection)
            .set('recruiterId', this.recruiterIdFilter);

        this.recruitmentService
            .getCompletedApplications(params)
            .pipe(first())
            .subscribe({
                next: (pagedMembers) => {
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
        const applications: ActiveApplication[] = this.userActiveApplications.concat(this.allOtherActiveApplications);
        for (const application of applications) {
            const teamspeakState: AsyncSubject<OnlineState> = new AsyncSubject<OnlineState>();
            this.teamspeakStates.Add(application.account.id, teamspeakState);

            this.recruitmentService
                .getTeamspeakOnlineState(application.account.id)
                .pipe(first())
                .subscribe({
                    next: (state) => {
                        teamspeakState.next(state);
                        teamspeakState.complete();
                    }
                });
        }
    }

    private getStats() {
        this.recruitmentService
            .getStats()
            .pipe(first())
            .subscribe({
                next: (response) => {
                    this.activity = response.activity;
                    this.yourStats = response.yourStats;
                    this.sr1Stats = response.sr1Stats;
                }
            });
    }
}
