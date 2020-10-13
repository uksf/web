import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-request-discharge-modal',
    templateUrl: './request-discharge-modal.component.html',
    styleUrls: ['./request-discharge-modal.component.css']
})
export class RequestDischargeModalComponent implements OnInit {
    form: FormGroup;
    possibleRecipients;

    constructor(
        private dialog: MatDialog,
        private httpClient: HttpClient,
        private urlService: UrlService,
        private formbuilder: FormBuilder
    ) {
        this.form = this.formbuilder.group({
            recipient: ['', Validators.required],
            reason: ['', Validators.required]
        }, {});
        this.httpClient.get(this.urlService.apiUrl + '/accounts/under?reverse=true').subscribe(response => {
            this.possibleRecipients = response;
        });
    }

    ngOnInit() { }

    submit() {
        const formString = JSON.stringify(this.form.getRawValue()).replace(/\n|\r/g, '');
        this.httpClient.put(this.urlService.apiUrl + '/commandrequests/create/discharge', formString, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(_ => {
            this.dialog.closeAll();
        }, error => {
            this.dialog.closeAll();
            this.dialog.open(MessageModalComponent, {
                data: { message: error.error }
            });
        });
    }
}
