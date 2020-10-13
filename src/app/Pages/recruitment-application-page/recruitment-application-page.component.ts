import { Component, ViewChild } from '@angular/core';
import { Location, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UrlService } from '../../Services/url.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommentDisplayComponent } from '../../Components/comment-display/comment-display.component';
import { MembershipState, ApplicationState, AccountService } from '../../Services/account.service';
import { Permissions } from 'app/Services/permissions';
import { CountryPickerService, ICountry } from 'app/Services/CountryPicker/country-picker.service';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { PermissionsService } from 'app/Services/permissions.service';

@Component({
    selector: 'app-recruitment-application-page',
    templateUrl: './recruitment-application-page.component.html',
    styleUrls: ['./recruitment-application-page.component.scss'],
    providers: [DatePipe],
})
export class RecruitmentApplicationPageComponent {
    @ViewChild('recruiterCommentsDisplay') recruiterCommentDisplay: CommentDisplayComponent;
    @ViewChild('applicationCommentsDisplay') applicationCommentDisplay: CommentDisplayComponent;
    membershipState = MembershipState;
    applicationState = ApplicationState;
    countries: ICountry[];
    accountId: string;
    application;
    ratingsForm: FormGroup;
    recruiters: any;
    ratings: any;
    selected: any;
    updating: boolean;

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
                criticism: [],
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
        this.httpClient.get(this.urls.apiUrl + '/recruitment/' + this.accountId).subscribe((response: any) => {
            const application = response;
            if (application.account.id === this.accountService.account.id && application.account.application.state === ApplicationState.WAITING) {
                this.router.navigate(['/application']);
                return;
            }

            if (
                application.account.id === this.accountService.account.id ||
                this.permissions.hasAnyPermissionOf([Permissions.RECRUITER, Permissions.RECRUITER_LEAD, Permissions.COMMAND, Permissions.ADMIN])
            ) {
                this.application = application;
                this.ratingsForm.patchValue(this.application.account.application.ratings);

                if (this.permissions.hasPermission(Permissions.RECRUITER_LEAD)) {
                    this.httpClient.get(this.urls.apiUrl + '/recruitment/recruiters').subscribe((recruiterResponse) => {
                        this.recruiters = recruiterResponse;
                        this.selected = this.application.recruiterId;
                    });
                }
                this.updating = false;
            } else {
                this.router.navigate(['/home']);
            }
        });
    }

    setNewRecruiter(newRecruiter: any) {
        this.updating = true;
        this.httpClient.post(this.urls.apiUrl + '/recruitment/recruiter/' + this.accountId, { newRecruiter: newRecruiter }).subscribe(
            () => {
                this.getApplication();
                this.recruiterCommentDisplay.getCanPostComment();
                this.applicationCommentDisplay.getCanPostComment();
            },
            (_) => {
                this.updating = false;
            }
        );
    }

    applyRating(e1: { value: any }, e2: any) {
        this.updating = true;
        this.httpClient.post(this.urls.apiUrl + '/recruitment/ratings/' + this.accountId, { key: e2, value: e1.value }).subscribe(
            () => {},
            (_) => {
                this.updating = false;
            }
        );
    }

    updateApplicationState(updatedState: ApplicationState) {
        this.updating = true;
        this.httpClient.post(this.urls.apiUrl + '/recruitment/' + this.accountId, { updatedState: updatedState }).subscribe(
            () => {
                this.getApplication();
            },
            (_) => {
                this.updating = false;
            }
        );
    }

    resetApplicationToCandidate() {
        this.dialog
            .open(ConfirmationModalComponent, {
                data: { message: `Are you sure you want to reset ${this.application.displayName} to a Candidate?\nThis will remove any rank, unit, and role assignments.` },
            })
            .componentInstance.confirmEvent.subscribe(() => {
                this.updateApplicationState(ApplicationState.WAITING);
            });
    }

    isAcceptableAge() {
        return this.application.age.years >= 16 || (this.application.age.years === 15 && this.application.age.months === 11);
    }

    getAgeColour() {
        return this.application.age.years >= 16 ? 'green' : this.application.age.years === 15 && this.application.age.months === 11 ? 'goldenrod' : 'red';
    }

    getDiscordName() {
        return this.application.communications.discordOnline
            ? this.application.communications.discordNickname !== this.application.displayName
                ? 'Online as ' + this.application.communications.discordNickname
                : 'Online'
            : this.application.communications.discordNickname === ''
            ? 'Offline (Not in server)'
            : 'Offline';
    }

    back() {
        this.router.navigate(['/recruitment']);
    }
}
