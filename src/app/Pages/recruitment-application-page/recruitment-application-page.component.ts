import { Component, ViewChild } from '@angular/core';
import { DatePipe, Location } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UrlService } from '../../Services/url.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommentDisplayComponent } from '../../Components/comment-display/comment-display.component';
import { AccountService } from '../../Services/account.service';
import { Permissions } from 'app/Services/permissions';
import { CountryPickerService, ICountry } from 'app/Services/CountryPicker/country-picker.service';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { PermissionsService } from 'app/Services/permissions.service';
import { MembershipState } from '../../Models/Account';
import { AsyncSubject } from 'rxjs';
import { ApplicationState, DetailedApplication, Recruiter } from '../../Models/Application';
import { OnlineState } from '../../Models/OnlineState';
import { MessageModalComponent } from '../../Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-recruitment-application-page',
    templateUrl: './recruitment-application-page.component.html',
    styleUrls: ['./recruitment-application-page.component.scss'],
    providers: [DatePipe]
})
export class RecruitmentApplicationPageComponent {
    @ViewChild('recruiterCommentsDisplay') recruiterCommentDisplay: CommentDisplayComponent;
    @ViewChild('applicationCommentsDisplay') applicationCommentDisplay: CommentDisplayComponent;
    membershipState = MembershipState;
    applicationState = ApplicationState;
    countries: ICountry[];
    accountId: string;
    application: DetailedApplication;
    ratingsForm: FormGroup;
    recruiters: Recruiter[];
    ratings: any;
    selected: any;
    updating: boolean;
    teamspeakState: AsyncSubject<OnlineState> = new AsyncSubject<OnlineState>();
    discordState: AsyncSubject<OnlineState> = new AsyncSubject<OnlineState>();

    constructor(
        private httpClient: HttpClient,
        private urls: UrlService,
        private formbuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private permissions: PermissionsService,
        private accountService: AccountService,
        private location: Location,
        private dialog: MatDialog
    ) {
        this.ratingsForm = this.formbuilder.group(
            {
                attitude: [],
                sociability: [],
                maturity: [],
                skills: [],
                criticism: []
            },
            {}
        );
        this.countries = CountryPickerService.countries;

        if (this.route.snapshot.params.id) {
            this.accountId = this.route.snapshot.params.id;
        } else {
            this.accountId = this.accountService.account.id;
        }

        this.getApplication();
    }

    getApplication() {
        this.httpClient.get(this.urls.apiUrl + '/recruitment/' + this.accountId).subscribe((response: DetailedApplication) => {
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
                this.ratingsForm.patchValue(this.application.account.application.ratings);

                if (this.permissions.hasPermission(Permissions.RECRUITER_LEAD)) {
                    this.httpClient.get(this.urls.apiUrl + '/recruitment/recruiters').subscribe((recruiters: Recruiter[]) => {
                        this.recruiters = recruiters;
                        this.selected = this.application.recruiterId;
                    });
                }
                this.updating = false;
            } else {
                this.router.navigate(['/home']).then();
            }
        });

        this.getTeamspeakState();
        this.getDiscordState();
    }

    getTeamspeakState() {
        this.httpClient.get(`${this.urls.apiUrl}/teamspeak/${this.accountId}/onlineUserDetails`).subscribe((state: OnlineState) => {
            this.teamspeakState.next(state);
            this.teamspeakState.complete();
        });
    }

    getDiscordState() {
        this.httpClient.get(`${this.urls.apiUrl}/discord/${this.accountId}/onlineUserDetails`).subscribe((state: OnlineState) => {
            this.discordState.next(state);
            this.discordState.complete();
        });
    }

    setNewRecruiter(newRecruiter: any) {
        this.updating = true;
        this.httpClient.post(this.urls.apiUrl + '/recruitment/recruiter/' + this.accountId, { newRecruiter: newRecruiter }).subscribe({
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

    applyRating(e1: { value: any }, e2: any) {
        this.updating = true;
        this.httpClient.post(this.urls.apiUrl + '/recruitment/ratings/' + this.accountId, { key: e2, value: e1.value }).subscribe({
            next: () => {},
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
        this.httpClient.post(this.urls.apiUrl + '/recruitment/' + this.accountId, { updatedState: updatedState }).subscribe({
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
            .componentInstance.confirmEvent.subscribe(() => {
                this.updateApplicationState(ApplicationState.WAITING);
            });
    }

    isAcceptableAge() {
        return this.application.age.years >= this.application.acceptableAge || (this.application.age.years === this.application.acceptableAge - 1 && this.application.age.months === 11);
    }

    getAgeColour() {
        return this.application.age.years >= this.application.acceptableAge
            ? 'green'
            : this.application.age.years === this.application.acceptableAge - 1 && this.application.age.months === 11
            ? 'goldenrod'
            : 'red';
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
}
