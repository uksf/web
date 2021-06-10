import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { Router } from '@angular/router';
import { AccountService } from '../../Services/account.service';
import { ThemeEmitterComponent } from 'app/Components/elements/theme-emitter/theme-emitter.component';
import { MembershipState } from '../../Models/Account';
import { ApplicationsOverview, ApplicationState, CompletedApplication, WaitingApplication } from '../../Models/Application';
import { AsyncSubject } from 'rxjs';
import { OnlineState } from '../../Models/OnlineState';
import { Dictionary } from '../../Models/Dictionary';

@Component({
    selector: 'app-recruitment-page',
    templateUrl: './recruitment-page.component.html',
    styleUrls: ['./recruitment-page.component.scss'],
})
export class RecruitmentPageComponent implements OnInit {
    @ViewChild(ThemeEmitterComponent) theme: ThemeEmitterComponent;
    membershipState = MembershipState;
    waiting: WaitingApplication[] = [];
    allWaiting: WaitingApplication[] = [];
    complete: CompletedApplication[] = [];
    recruiters: string[];
    activity: any[] = [];
    yourStats;
    sr1Stats;
    filteredAndSearched: CompletedApplication[] = [];
    filtered: CompletedApplication[] = [];
    searched: CompletedApplication[] = [];
    applicationHistory: CompletedApplication[] = [];
    teamspeakStates: Dictionary<AsyncSubject<OnlineState>> = new Dictionary<AsyncSubject<OnlineState>>();
    loaded = false;
    descending = false;
    searchValue = '';
    index = 0;
    length = 25;
    lengths = [
        { value: 25, name: '25' },
        { value: 50, name: '50' },
        { value: 100, name: '100' },
    ];
    private timeout;
    applicationState = ApplicationState;
    accountService: AccountService;

    constructor(newAccountService: AccountService, private httpClient: HttpClient, private urls: UrlService, private router: Router) {
        this.accountService = newAccountService;
    }

    ngOnInit() {
        this.getApplications();
        this.getStats();
    }

    private getApplications() {
        this.httpClient.get(this.urls.apiUrl + '/recruitment').subscribe((applicationsOverview: ApplicationsOverview) => {
            this.waiting = applicationsOverview.waiting;
            this.allWaiting = applicationsOverview.allWaiting;
            this.complete = applicationsOverview.complete;
            this.recruiters = applicationsOverview.recruiters;
            this.getTeamspeakOnlineStates();

            this.filteredAndSearched = this.complete;
            this.filtered = this.complete;
            this.searched = this.complete;
            this.sort(2);
            this.loaded = true;
        });
    }

    private getTeamspeakOnlineStates() {
        let applications = this.waiting.concat(this.allWaiting);
        for (const application of applications) {
            let teamspeakState = new AsyncSubject<OnlineState>();
            this.teamspeakStates.Add(application.account.id, teamspeakState);

            this.httpClient.get(`${this.urls.apiUrl}/teamspeak/${application.account.id}/onlineUserDetails`).subscribe((state: OnlineState) => {
                teamspeakState.next(state);
                teamspeakState.complete();
            });
        }
    }

    private getStats() {
        this.httpClient.get(this.urls.apiUrl + '/recruitment/stats').subscribe((response) => {
            this.activity = response['activity'];
            this.yourStats = response['yourStats'];
            this.sr1Stats = response['sr1Stats'];
        });
    }

    getApplicationColour(application) {
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

    setSr1Enabled(recruiter = null) {
        let value = false;
        if (recruiter == null) {
            recruiter = this.accountService.account;
            value = !recruiter.settings.sr1Enabled;
        } else {
            recruiter = recruiter.account;
            value = recruiter.settings.sr1Enabled;
        }

        this.httpClient
            .post(this.urls.apiUrl + '/accounts/updatesetting/' + recruiter.id, {
                name: 'sr1Enabled',
                value: value,
            })
            .subscribe((_) => {
                recruiter = this.activity.find((x) => x.account.id === recruiter.id);
                if (recruiter !== undefined) {
                    recruiter.account.settings.sr1Enabled = value;
                }
            });
    }

    openApplication(application) {
        this.router.navigate(['/recruitment', application.account.id]);
    }

    capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    sort(mode: number) {
        switch (mode) {
            case 1: // Applied
                const compareApplied = this.descending
                    ? function (a, b) {
                          return a.account.application.dateCreated > b.account.application.dateCreated ? 1 : b.account.application.dateCreated > a.account.application.dateCreated ? -1 : 0;
                      }
                    : function (a, b) {
                          return a.account.application.dateCreated < b.account.application.dateCreated ? 1 : b.account.application.dateCreated < a.account.application.dateCreated ? -1 : 0;
                      };
                this.filteredAndSearched.sort(compareApplied);
                break;
            case 2: // Completed
                const compareCompleted = this.descending
                    ? function (a, b) {
                          return a.account.application.dateAccepted > b.account.application.dateAccepted ? 1 : b.account.application.dateAccepted > a.account.application.dateAccepted ? -1 : 0;
                      }
                    : function (a, b) {
                          return a.account.application.dateAccepted < b.account.application.dateAccepted ? 1 : b.account.application.dateAccepted < a.account.application.dateAccepted ? -1 : 0;
                      };
                this.filteredAndSearched.sort(compareCompleted);
                break;
            default:
                // Name
                const compareName = this.descending
                    ? function (a, b) {
                          return a.account.lastname > b.account.lastname ? 1 : b.account.lastname > a.account.lastname ? -1 : 0;
                      }
                    : function (a, b) {
                          return a.account.lastname < b.account.lastname ? 1 : b.account.lastname < a.account.lastname ? -1 : 0;
                      };
                this.filteredAndSearched.sort(compareName);
                break;
        }
        this.navigate(-1);
        this.descending = !this.descending;
    }

    filter(sr1: string) {
        this.filtered = [];
        this.complete.forEach((element) => {
            if (String(element.recruiter).toLowerCase().indexOf(sr1.toLowerCase()) !== -1) {
                this.filtered.push(element);
            }
        });
        this.filteredAndSearched = this.filtered.filter((n) => this.searched.includes(n));
        this.index = 0;
        this.navigate(-1);
    }

    search(newValue: string) {
        window.clearTimeout(this.timeout);
        this.timeout = window.setTimeout(() => {
            this.searched = [];
            this.complete.forEach((element) => {
                if (String(element.account.lastname).toLowerCase().indexOf(newValue.toLowerCase()) !== -1) {
                    this.searched.push(element);
                }
            });
            this.filteredAndSearched = this.searched.filter((n) => this.filtered.includes(n));
            this.index = 0;
            this.navigate(-1);
        }, 150);
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
        this.applicationHistory = this.filteredAndSearched.slice(this.index, this.index + this.length);
    }

    getHistoryColour(application) {
        return application.account.application.state !== this.applicationState.WAITING && application.account.membershipState === this.membershipState.DISCHARGED
            ? 'goldenrod'
            : application.account.application.state === this.applicationState.ACCEPTED
            ? 'green'
            : 'red';
    }

    trackByApplication(application): number {
        return application;
    }
}
