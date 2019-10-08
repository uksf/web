import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';
import { UrlService } from '../../Services/url.service';
import { Router } from '@angular/router';
import { AccountService, ApplicationState, MembershipState } from '../../Services/account.service';
import { ThemeEmitterComponent } from 'app/Components/theme-emitter/theme-emitter.component';

@Component({
    selector: 'app-recruitment-page',
    templateUrl: './recruitment-page.component.html',
    styleUrls: ['./recruitment-page.component.scss']
})
export class RecruitmentPageComponent implements OnInit {
    @ViewChild(ThemeEmitterComponent, { static: false }) theme: ThemeEmitterComponent;
    membershipState = MembershipState;
    waiting: any[] = [];
    allWaiting: any[] = [];
    complete;
    recruiters;
    activity: any[] = [];
    yourStats;
    sr1Stats;
    filteredAndSearched: any[] = [];
    filtered: any[] = [];
    searched: any[] = [];
    applicationHistory: any[] = [];
    loaded = false;
    descending = false;
    searchValue = '';
    index = 0;
    length = 25;
    lengths = [
        { 'value': 25, 'name': '25' },
        { 'value': 50, 'name': '50' },
        { 'value': 100, 'name': '100' }
    ];
    private timeout;
    mobile = false;
    applicationState = ApplicationState;
    accountService: AccountService;

    constructor(
        as: AccountService,
        private httpClient: HttpClient,
        private auth: AuthenticationService,
        private urls: UrlService,
        private router: Router
    ) {
        this.accountService = as;
    }

    ngOnInit() {
        this.getApplications();
        this.getStats();
        this.mobile = window.screen.width < 450;
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.mobile = window.screen.width < 450;
    }

    private getApplications() {
        this.httpClient.get(this.urls.apiUrl + '/recruitment').subscribe(response => {
            this.waiting = response['waiting'];
            this.allWaiting = response['allWaiting'];
            this.complete = response['complete'];
            this.recruiters = response['recruiters'];
            this.filteredAndSearched = this.complete;
            this.filtered = this.complete;
            this.searched = this.complete;
            this.sort(2);
            this.loaded = true;
        }, error => this.urls.errorWrapper('Failed to get applications', error));
    }

    private getStats() {
        this.httpClient.get(this.urls.apiUrl + '/recruitment/stats').subscribe(response => {
            this.activity = response['activity'];
            this.yourStats = response['yourStats'];
            this.sr1Stats = response['sr1Stats'];
        }, error => this.urls.errorWrapper('Failed to get recruitment stats', error));
    }

    getApplicationColour(application) {
        return application.processingDifference < 0 ? 'green' :
            application.processingDifference > 10 ? 'red' :
                application.processingDifference > 7 ? 'orange' :
                    application.processingDifference > 5 ? 'goldenrod' : this.theme.foregroundColor;
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
        this.httpClient.post(this.urls.apiUrl + '/accounts/updatesetting/' + recruiter.id, {
            name: 'sr1Enabled',
            value: value
        }).subscribe(_ => {
            this.activity.find(x => x.account.id === recruiter.id).account.settings.sr1Enabled = value;
        }, error => this.urls.errorWrapper('Getting account data failed', error));
    }

    openApplication(application) {
        this.router.navigate(['/recruitment', application.account.id]);
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    private sort(mode) {
        switch (mode) {
            case 1: // Applied
                const compareApplied = this.descending
                    ? function (a, b) {
                        return (a.account.application.dateCreated > b.account.application.dateCreated) ? 1 :
                            ((b.account.application.dateCreated > a.account.application.dateCreated) ? -1 : 0);
                    } : function (a, b) {
                        return (a.account.application.dateCreated < b.account.application.dateCreated) ? 1 :
                            ((b.account.application.dateCreated < a.account.application.dateCreated) ? -1 : 0);
                    };
                this.filteredAndSearched.sort(compareApplied);
                break;
            case 2: // Completed
                const compareCompleted = this.descending
                    ? function (a, b) {
                        return (a.account.application.dateAccepted > b.account.application.dateAccepted) ? 1 :
                            ((b.account.application.dateAccepted > a.account.application.dateAccepted) ? -1 : 0);
                    } : function (a, b) {
                        return (a.account.application.dateAccepted < b.account.application.dateAccepted) ? 1 :
                            ((b.account.application.dateAccepted < a.account.application.dateAccepted) ? -1 : 0);
                    };
                this.filteredAndSearched.sort(compareCompleted);
                break;
            default: // Name
                const compareName = this.descending
                    ? function (a, b) {
                        return (a.account.lastname > b.account.lastname) ? 1 :
                            ((b.account.lastname > a.account.lastname) ? -1 : 0);
                    } : function (a, b) {
                        return (a.account.lastname < b.account.lastname) ? 1 :
                            ((b.account.lastname < a.account.lastname) ? -1 : 0);
                    };
                this.filteredAndSearched.sort(compareName);
                break;
        }
        this.navigate(-1);
        this.descending = !this.descending;
    }

    filter(sr1: string) {
        this.filtered = [];
        this.complete.forEach(element => {
            if (String(element.recruiter).toLowerCase().indexOf(sr1.toLowerCase()) !== -1) {
                this.filtered.push(element);
            }
        });
        this.filteredAndSearched = this.filtered.filter(n => this.searched.includes(n));
        this.index = 0;
        this.navigate(-1);
    }

    search(newValue: string) {
        window.clearTimeout(this.timeout);
        this.timeout = window.setTimeout(() => {
            this.searched = [];
            this.complete.forEach(element => {
                if (String(element.account.lastname).toLowerCase().indexOf(newValue.toLowerCase()) !== -1) {
                    this.searched.push(element);
                }
            });
            this.filteredAndSearched = this.searched.filter(n => this.filtered.includes(n));
            this.index = 0;
            this.navigate(-1);
        }, 150);
    }

    private navigate(mode) {
        switch (mode) {
            case 0: // Previous
                this.index -= this.length;
                break;
            case 1: // Next
                this.index += this.length;
                break;
            default: // Don't navigate
                break;
        }
        this.applicationHistory = this.filteredAndSearched.slice(this.index, this.index + this.length);
    }

    getHistoryColour(application) {
        return application.account.application.state !== this.applicationState.WAITING && application.account.membershipState === this.membershipState.DISCHARGED ? 'goldenrod' : application.account.application.state === this.applicationState.ACCEPTED ? 'green' : 'red';
    }

    trackByApplication(application): number { return application; }
}
