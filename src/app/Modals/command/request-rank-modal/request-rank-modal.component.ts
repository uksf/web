import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-request-rank-modal',
    templateUrl: './request-rank-modal.component.html',
    styleUrls: ['./request-rank-modal.component.css']
})
export class RequestRankModalComponent implements OnInit {
    form: FormGroup;
    possibleRanks;
    possibleRecipients;

    ngOnInit() { }

    constructor(
        private dialog: MatDialog,
        private httpClient: HttpClient,
        private urlService: UrlService,
        private formbuilder: FormBuilder
    ) {
        this.form = this.formbuilder.group({
            recipient: ['', Validators.required],
            value: ['', Validators.required],
            reason: ['', Validators.required]
        }, {});
        this.httpClient.get(this.urlService.apiUrl + '/accounts/under').subscribe(response => {
            this.possibleRecipients = response;
        });
        this.form.controls.value.disable();
    }

    onSelectRecipient(event) {
        this.httpClient.get(this.urlService.apiUrl + '/ranks/' + event.value).subscribe(response => {
            this.possibleRanks = response;
            this.form.controls.value.enable();
        });
    }

    submit() {
        const formString = JSON.stringify(this.form.getRawValue()).replace(/\n|\r/g, '');
        this.httpClient.put(this.urlService.apiUrl + '/commandrequests/create/rank', formString, {
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
