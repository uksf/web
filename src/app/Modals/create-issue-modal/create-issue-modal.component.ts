import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from 'app/Services/formhelper.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NewIssueRequest, NewIssueResponse, NewIssueType } from '../../Models/Issues';
import { UksfError } from '../../Models/Response';

@Component({
    selector: 'app-create-issue-modal',
    templateUrl: './create-issue-modal.component.html',
    styleUrls: ['./create-issue-modal.component.scss']
})
export class CreateIssueModalComponent implements OnInit {
    newIssueTypeEnum = NewIssueType;
    form: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    validationMessages = {
        title: [{ type: 'required', message: 'Title is required' }],
        body: [{ type: 'required', message: 'Body is required' }]
    };
    type: NewIssueType = NewIssueType.WEBSITE;
    body = '';
    issueUrl = 'https://github.com/uksf/website-issues/issues/202';
    pending = false;
    error = undefined;

    constructor(formbuilder: FormBuilder, private httpClient: HttpClient, private urls: UrlService, @Inject(MAT_DIALOG_DATA) public data: NewIssueType) {
        this.type = this.data;
        this.form = formbuilder.group({
            title: ['', Validators.required],
            body: ['', Validators.required]
        });
    }

    ngOnInit() {}

    submit() {
        const newIssueRequest: NewIssueRequest = {
            issueType: this.type,
            title: this.form.controls['title'].value,
            body: this.body
        };
        this.pending = true;
        this.httpClient
            .post(`${this.urls.apiUrl}/issue`, newIssueRequest, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
            .subscribe({
                next: (response: NewIssueResponse) => {
                    this.issueUrl = response.issueUrl;
                },
                error: (error: UksfError) => {
                    this.pending = false;
                    this.error = error.error;
                }
            });
    }
}
