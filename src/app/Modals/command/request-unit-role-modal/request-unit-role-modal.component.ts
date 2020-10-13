import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-request-unit-role-modal',
    templateUrl: './request-unit-role-modal.component.html',
    styleUrls: ['./request-unit-role-modal.component.css'],
})
export class RequestUnitRoleModalComponent implements OnInit {
    form: FormGroup;
    possibleRoles;
    possibleUnits;
    possibleRecipients;

    ngOnInit() {}

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urlService: UrlService, private formbuilder: FormBuilder) {
        this.form = this.formbuilder.group(
            {
                recipient: ['', Validators.required],
                value: ['', Validators.required],
                secondaryValue: ['', Validators.required],
                reason: ['', Validators.required],
            },
            {}
        );
        this.httpClient.get(this.urlService.apiUrl + '/accounts/under').subscribe((response) => {
            this.possibleRecipients = response;
        });
        this.form.controls.value.disable();
        this.form.controls.secondaryValue.disable();
    }

    onSelectRecipient(event) {
        this.httpClient.get(`${this.urlService.apiUrl}/units?accountId=${event.value}`).subscribe((response) => {
            this.possibleUnits = response;
            this.form.controls.value.enable();
        });
    }

    onSelectUnit(event) {
        this.httpClient.get(this.urlService.apiUrl + '/roles?id=' + this.form.controls.recipient.value + '&unitId=' + event.value).subscribe((response) => {
            this.possibleRoles = response;
            this.possibleRoles.unshift({ name: 'None' });
            this.form.controls.secondaryValue.enable();
        });
    }

    submit() {
        const formString = JSON.stringify(this.form.getRawValue()).replace(/\n|\r/g, '');
        this.httpClient
            .put(this.urlService.apiUrl + '/commandrequests/create/unitrole', formString, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
            })
            .subscribe(
                (_) => {
                    this.dialog.closeAll();
                },
                (error) => {
                    this.dialog.closeAll();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error },
                    });
                }
            );
    }
}
