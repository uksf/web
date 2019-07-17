import { Component, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UrlService } from '../../Services/url.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommentDisplayComponent } from '../../Components/comment-display/comment-display.component';
import { MembershipState, ApplicationState, AccountService } from '../../Services/account.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { Permissions } from 'app/Services/permissions';
import { CountryPickerService, ICountry } from 'app/Services/CountryPicker/country-picker.service';

@Component({
    selector: 'app-recruitment-application-page',
    templateUrl: './recruitment-application-page.component.html',
    styleUrls: ['./recruitment-application-page.component.css']
})
export class RecruitmentApplicationPageComponent {
    @ViewChild('recruiterCommentsDisplay') recruiterCommentDisplay: CommentDisplayComponent;
    @ViewChild('applicationCommentsDisplay') applicationCommentDisplay: CommentDisplayComponent;
    membershipState = MembershipState;
    applicationState = ApplicationState;
    countries: ICountry[];
    accountId;
    application;
    ratingsForm: FormGroup;
    recruiters;
    ratings;
    selected;

    constructor(
        private httpClient: HttpClient,
        private urls: UrlService,
        private formbuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private permissions: NgxPermissionsService,
        private accountService: AccountService,
        private location: Location
    ) {
        this.ratingsForm = this.formbuilder.group({
            attitude: [],
            sociability: [],
            maturity: [],
            skills: [],
            criticism: []
        }, {});
        this.countries = CountryPickerService.countries;
        if (this.route.snapshot.params.id) {
            this.accountId = this.route.snapshot.params.id;
        } else {
            this.accountId = this.accountService.account.id;
        }
        this.getApplication();
        const grantedPermissions = this.permissions.getPermissions();
        if (grantedPermissions[Permissions.SR1_LEAD]) {
            this.httpClient.get(this.urls.apiUrl + '/recruitment/recruiters/' + this.accountId).subscribe(response => {
                this.recruiters = response;
            });
        }
    }

    getApplication() {
        this.httpClient.get(this.urls.apiUrl + '/recruitment/' + this.accountId).subscribe((response: any) => {
            const application = response;
            const grantedPermissions = this.permissions.getPermissions();
            if (application.account.id === this.accountService.account.id && application.account.application.state === ApplicationState.WAITING) {
                this.router.navigate(['/application']);
                return;
            }
            if (application.account.id !== this.accountService.account.id && !grantedPermissions[Permissions.SR1]
                && !grantedPermissions[Permissions.SR1_LEAD] && !grantedPermissions[Permissions.COMMAND] && !grantedPermissions[Permissions.ADMIN]) {
                this.router.navigate(['/home']);
                return;
            }
            this.application = application;
            this.ratingsForm.patchValue(this.application.account.application.ratings);
        });
    }

    setNewRecruiter(newRecruiter) {
        this.httpClient.post(
            this.urls.apiUrl + '/recruitment/recruiter/' + this.accountId, { newRecruiter: newRecruiter }
        ).subscribe(() => {
            this.getApplication();
            this.recruiterCommentDisplay.getCanPostComment();
            this.applicationCommentDisplay.getCanPostComment();
            this.httpClient.get(this.urls.apiUrl + '/applications/recruiters/' + this.accountId).subscribe(response => {
                this.recruiters = response;
            });
            this.selected = '';
        });
    }

    applyRating(e1, e2) {
        this.httpClient.post(
            this.urls.apiUrl + '/recruitment/ratings/' + this.accountId, { key: e2, value: e1.value }
        ).subscribe(() => {

        });
    }

    updateApplicationState(updatedState) {
        this.httpClient.post(
            this.urls.apiUrl + '/recruitment/' + this.accountId, { updatedState: updatedState }
        ).subscribe(() => {
            this.getApplication();
        });
    }

    back() {
        this.location.back();
    }
}
