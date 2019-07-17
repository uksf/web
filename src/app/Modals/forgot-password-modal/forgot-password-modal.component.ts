import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { MatDialog } from '@angular/material';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

@Component({
    selector: 'app-forgot-password-modal',
    templateUrl: './forgot-password-modal.component.html',
    styleUrls: ['./forgot-password-modal.component.css']
})
export class ForgotPasswordModalComponent implements OnInit {
    public form: FormGroup;
    public success = false;
    public fail = false;

    constructor(
        public formbuilder: FormBuilder,
        private httpClient: HttpClient,
        private urls: UrlService,
        public dialog: MatDialog) {
        this.form = formbuilder.group({
            name: ['', Validators.maxLength(0)],
            email: ['', Validators.required]
        })

        this.form.valueChanges.subscribe(_ => {
            this.success = false;
            this.fail = false;
        });
    }

    ngOnInit() { }

    isEmailValid() {
        return EMAIL_REGEX.test(this.form.get('email').value);
    }

    get formErrors() {
        return this.form.errors.error;
    }

    submit() {
        // Honeypot field must be empty
        if (this.form.value.name !== '') { return; }
        const formObj = this.form.getRawValue();
        const formString = JSON.stringify(formObj).replace(/\n|\r/g, '');
        this.httpClient.put(this.urls.apiUrl + '/passwordreset', formString, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(_ => {
            this.success = true;
            this.fail = false;
        }, () => {
            this.success = false;
            this.fail = true;
        });
    }
}
