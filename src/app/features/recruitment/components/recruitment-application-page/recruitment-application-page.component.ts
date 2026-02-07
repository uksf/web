import { Component, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UrlService } from '@app/core/services/url.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommentDisplayComponent } from '@app/shared/components/comment-display/comment-display.component';
import { AccountService } from '@app/core/services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { MembershipState } from '@app/shared/models/account';
import { AsyncSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApplicationState, DetailedApplication, Recruiter } from '@app/features/application/models/application';
import { OnlineState } from '@app/shared/models/online-state';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { CountryPickerService, ICountry } from '@app/shared/services/country-picker/country-picker.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { Permissions } from '@app/core/services/permissions';

@Component({
    selector: 'app-recruitment-application-page',
    templateUrl: './recruitment-application-page.component.html',
    styleUrls: ['./recruitment-application-page.component.scss'],
    providers: [DatePipe]
})
export class RecruitmentApplicationPageComponent implements OnDestroy {
    private destroy$ = new Subject<void>();
    @ViewChild('recruiterCommentsDisplay') recruiterCommentDisplay: CommentDisplayComponent;
    @ViewChild('applicationCommentsDisplay') applicationCommentDisplay: CommentDisplayComponent;
    membershipState = MembershipState;
    applicationState = ApplicationState;
    countries: ICountry[];
    accountId: string;
    application: DetailedApplication;
    otherRolePreferenceOptions: string[];
    recruiters: Recruiter[];
    selected: string;
    updating: boolean;
    teamspeakState: AsyncSubject<OnlineState> = new AsyncSubject<OnlineState>();
    discordState: AsyncSubject<OnlineState> = new AsyncSubject<OnlineState>();
    adminOverride: boolean = false;
    rolePreferenceOptions: string[] = ['NCO', 'Officer', 'Aviation', 'Medic'];

    constructor(
        private httpClient: HttpClient,
        private urls: UrlService,
        private route: ActivatedRoute,
        private router: Router,
        private permissions: PermissionsService,
        private accountService: AccountService,
        private dialog: MatDialog
    ) {
        this.countries = CountryPickerService.countries;

        if (this.route.snapshot.params.id) {
            this.accountId = this.route.snapshot.params.id;
        } else {
            this.accountId = this.accountService.account.id;
        }

        this.getApplication();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    @HostListener('window:keydown', ['$event'])
    @HostListener('window:keyup', ['$event'])
    onKey(event: KeyboardEvent) {
        this.adminOverride = event.shiftKey && this.permissions.hasPermission(Permissions.SUPERADMIN);
    }

    getApplication() {
        this.httpClient.get(this.urls.apiUrl + '/recruitment/applications/' + this.accountId).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: DetailedApplication) => {
                const application = response;
                if (application.account.id === this.accountService.account.id && application.account.application.state === ApplicationState.WAITING) {
                    this.router.navigate(['/application']).then();
                    return;
                }

                if (
                    application.account.id === this.accountService.account.id ||
                    this.permissions.hasAnyPermissionOf([Permissions.RECRUITER, Permissions.RECRUITER_LEAD, Permissions.COMMAND, Permissions.ADMIN])
                ) {
                    this.application = application;
                    this.otherRolePreferenceOptions = this.rolePreferenceOptions.filter((x: string) => !application.account.rolePreferences.includes(x));

                    this.getTeamspeakState();
                    this.getDiscordState();

                    if (this.permissions.hasPermission(Permissions.RECRUITER_LEAD)) {
                        this.httpClient.get(this.urls.apiUrl + '/recruitment/recruiters').pipe(takeUntil(this.destroy$)).subscribe({
                            next: (recruiters: Recruiter[]) => {
                                this.recruiters = recruiters.filter((x: Recruiter) => x.active);
                                this.selected = this.application.recruiterId;
                            }
                        });
                    }
                    this.updating = false;
                } else {
                    this.router.navigate(['/home']).then();
                }
            }
        });
    }

    getTeamspeakState() {
        this.httpClient.get(`${this.urls.apiUrl}/teamspeak/${this.accountId}/onlineUserDetails`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (state: OnlineState) => {
                this.teamspeakState.next(state);
                this.teamspeakState.complete();
            }
        });
    }

    getDiscordState() {
        this.httpClient.get(`${this.urls.apiUrl}/discord/${this.accountId}/onlineUserDetails`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (state: OnlineState) => {
                this.discordState.next(state);
                this.discordState.complete();
            }
        });
    }

    setNewRecruiter(newRecruiter: string) {
        this.updating = true;
        this.httpClient.post(`${this.urls.apiUrl}/recruitment/applications/${this.accountId}/recruiter`, { newRecruiter: newRecruiter }).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getApplication();
                this.recruiterCommentDisplay.getCanPostComment();
                this.applicationCommentDisplay.getCanPostComment();
            },
            error: (error) => {
                this.updating = false;
                this.dialog.open(MessageModalComponent, {
                    data: { message: error }
                });
            }
        });
    }

    updateApplicationState(updatedState: ApplicationState) {
        this.updating = true;
        this.httpClient.post(`${this.urls.apiUrl}/recruitment/applications/${this.accountId}`, { updatedState: updatedState }).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getApplication();
            },
            error: (error) => {
                this.updating = false;
                this.dialog.open(MessageModalComponent, {
                    data: { message: error }
                });
            }
        });
    }

    resetApplicationToCandidate() {
        this.dialog
            .open(ConfirmationModalComponent, {
                data: { message: `Are you sure you want to reset ${this.application.displayName} to a Candidate?\nThis will remove any rank, unit, and role assignments.` }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.updateApplicationState(ApplicationState.WAITING);
                    }
                }
            });
    }

    isAcceptableAge() {
        return this.adminOverride || this.isApplicationAcceptableAge() || this.isApplicationJustAcceptableAge();
    }

    getAgeColour() {
        return this.isApplicationAcceptableAge() ? 'green' : this.isApplicationJustAcceptableAge() ? 'goldenrod' : 'red';
    }

    getDiscordName(discordState) {
        return discordState.online
            ? discordState.nickname !== this.application.displayName
                ? 'Online as ' + discordState.nickname
                : 'Online'
            : discordState.nickname === ''
            ? 'Offline (Not in server)'
            : 'Offline';
    }

    back() {
        this.router.navigate(['/recruitment']);
    }

    private isApplicationAcceptableAge() {
        return this.application.age.years >= this.application.acceptableAge;
    }

    private isApplicationJustAcceptableAge() {
        return this.application.age.years === this.application.acceptableAge - 1 && this.application.age.months === 11;
    }
}
