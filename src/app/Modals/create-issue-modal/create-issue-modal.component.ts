import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from 'app/Services/formhelper.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-create-issue-modal',
    templateUrl: './create-issue-modal.component.html',
    styleUrls: ['./create-issue-modal.component.css']
})
export class CreateIssueModalComponent implements OnInit {
    form: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    validationMessages = {
        'title': [
            { type: 'required', message: 'Title is required' },
        ], 'body': [
            { type: 'required', message: 'Body is required' }
        ]
    };
    type = 0;
    body = '';
    issueUrl;

    constructor(
        formbuilder: FormBuilder,
        private httpClient: HttpClient,
        private urls: UrlService,
        private dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.type = this.data.type;
        this.form = formbuilder.group({
            title: ['', Validators.required],
            body: ['', Validators.required]
        });
    }

    ngOnInit() { }

    submit() {
        const formString = JSON.stringify(this.form.getRawValue()).replace(/\n|\r/g, '');
        this.httpClient.put(`${this.urls.apiUrl}/issue?type=${this.type}`, formString, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(response => {
            this.issueUrl = response['issueUrl'];
        });
    }
}
