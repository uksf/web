import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { MatDialog, ErrorStateMatcher } from '@angular/material';
import { AccountService, ApplicationState } from 'app/Services/account.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from 'app/Services/url.service';
import { Router } from '@angular/router';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { PermissionsService } from 'app/Services/permissions.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { Permissions } from 'app/Services/permissions';

export class InstantErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return !!(control && !control.valid && (control.dirty || control.touched));
    }
}

@Component({
    selector: 'app-application-edit',
    templateUrl: './application-edit.component.html',
    styleUrls: ['../../../Pages/new-application-page/new-application-page.component.scss', './application-edit.component.scss']
})
export class ApplicationEditComponent {
    formGroup: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    referenceOptions = [
        { value: 'Google', viewValue: 'Google' },
        { value: 'Youtube', viewValue: 'Youtube' },
        { value: 'Reddit', viewValue: 'Reddit' },
        { value: 'Steam', viewValue: 'Steam' },
        { value: 'Recruiter', viewValue: 'Recruiter' },
        { value: 'Friend', viewValue: 'Friend' },
        { value: 'Other', viewValue: 'Other' }
    ];
    original;

    validation_messages = {
        'armaExperience': [
            { type: 'required', message: 'Details about your Arma experience are required' }
        ], 'unitsExperience': [
            { type: 'required', message: 'Details about your past Arma unit experience is required' }
        ], 'background': [
            { type: 'required', message: 'Some background info about yourself is required' }
        ]
    }

    constructor(
        public formBuilder: FormBuilder,
        public dialog: MatDialog,
        private httpClient: HttpClient,
        private urls: UrlService,
        private accountService: AccountService,
        private permissions: NgxPermissionsService,
        private permissionsService: PermissionsService,
        private router: Router
    ) {
        const grantedPermissions = this.permissions.getPermissions();
        if (grantedPermissions[Permissions.SR1]) {
            this.router.navigate(['/recruitment/' + this.accountService.account.id]);
            return;
        }
        this.formGroup = formBuilder.group({
            name: ['', Validators.maxLength(0)],
            armaExperience: ['', Validators.required],
            unitsExperience: ['', Validators.required],
            background: ['', Validators.required],
            militaryExperience: [''],
            officer: [''],
            nco: [''],
            aviation: [''],
            reference: ['', Validators.required]
        });
        this.formGroup.patchValue(this.accountService.account);
        this.original = JSON.stringify(this.formGroup.getRawValue());
        this.permissionsService.accountUpdateEvent.subscribe(() => {
            this.formGroup.patchValue(this.accountService.account);
            this.original = JSON.stringify(this.formGroup.getRawValue());
        });
    }

    get accepted() {
        return this.accountService.account.application.state === ApplicationState.ACCEPTED;
    }

    get rejected() {
        return this.accountService.account.application.state === ApplicationState.REJECTED;
    }

    get applicationState() {
        return this.accountService.account.application.state === ApplicationState.ACCEPTED ? 'Application Accepted' : this.accountService.account.application.state === ApplicationState.REJECTED ? 'Application Rejected' : 'Application Submitted';
    }

    get name() {
        return `Cdt.${this.accountService.account.lastname}.${this.accountService.account.firstname[0]}`;
    }

    get applicationCommentThread() {
        return this.accountService.account.application.applicationCommentThread;
    }

    update() {
        // Honeypot field must be empty
        if (this.formGroup.value.name !== '') { return; }
        const formString = JSON.stringify(this.formGroup.getRawValue()).replace(/\n|\r/g, '');
        this.httpClient.post(this.urls.apiUrl + '/applications/update', formString, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        }).subscribe(() => {
            this.accountService.getAccount(() => {
                this.formGroup.patchValue(this.accountService.account);
                this.original = JSON.stringify(this.formGroup.getRawValue());
            });
            this.dialog.open(MessageModalComponent, {
                data: { message: 'Your application was successfully updated' }
            });
        }, error => {
            this.dialog.open(MessageModalComponent, {
                data: { message: 'Failed to update application' }
            });
        });
    }

    get changesMade() {
        return this.original !== JSON.stringify(this.formGroup.getRawValue());
    }
}
