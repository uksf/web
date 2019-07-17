import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { AccountService } from '../../Services/account.service';
import { PermissionsService } from '../../Services/permissions.service';

@Component({
    selector: 'app-change-first-last-modal',
    templateUrl: './change-first-last-modal.component.html',
    styleUrls: ['./change-first-last-modal.component.css']
})
export class ChangeFirstLastModalComponent implements OnInit {
    form: FormGroup;
    changed = false;
    original;
    rank;

    constructor(
        formbuilder: FormBuilder,
        private httpClient: HttpClient,
        private urls: UrlService,
        private accountService: AccountService,
        private permissionsService: PermissionsService
    ) {
        this.form = formbuilder.group({
            firstname: ['', Validators.required],
            lastname: ['', Validators.required]
        })
        this.form.controls['firstname'].setValue(this.accountService.account.firstname);
        this.form.controls['lastname'].setValue(this.accountService.account.lastname);
        this.httpClient.get(this.urls.apiUrl + '/ranks').subscribe((ranks: any[]) => {
            this.rank = ranks.find(x => x.name === this.accountService.account.rank).abbreviation;
        });
    }

    ngOnInit() {
        this.original = JSON.stringify(this.form.getRawValue());
    }

    changeName() {
        const formString = JSON.stringify(this.form.getRawValue()).replace(/\n|\r/g, '');
        this.httpClient.put(this.urls.apiUrl + '/accounts/name', formString, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(_ => {
            this.permissionsService.refresh().then(() => {
                this.changed = true;
            });
        });
    }

    get changesMade() {
        return this.original !== JSON.stringify(this.form.getRawValue());
    }

    get formErrors() {
        return this.form.errors.error;
    }
}

