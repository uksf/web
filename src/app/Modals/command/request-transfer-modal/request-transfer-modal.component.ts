import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-request-transfer-modal',
    templateUrl: './request-transfer-modal.component.html',
    styleUrls: ['./request-transfer-modal.component.css']
})
export class RequestTransferModalComponent implements OnInit {
    form: FormGroup;
    possibleUnits;
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
        this.httpClient.get(this.urlService.apiUrl + '/units/' + event.value + '?filter=available').subscribe(response => {
            this.possibleUnits = response;
            this.form.controls.value.enable();
        });
    }

    submit() {
        const formString = JSON.stringify(this.form.getRawValue()).replace(/\n|\r/g, '');
        this.httpClient.put(this.urlService.apiUrl + '/commandrequests/create/transfer', formString, {
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
