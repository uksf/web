import { Component, OnInit, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { InstantErrorStateMatcher } from 'app/Services/formhelper.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { Moment } from 'moment';
import * as moment from 'moment';

@Component({
    selector: 'app-request-loa-modal',
    templateUrl: './request-loa-modal.component.html',
    styleUrls: ['./request-loa-modal.component.scss']
})
export class RequestLoaModalComponent implements OnInit {
    form: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    validationMessages = {
        'reason': [
            { type: 'required', message: 'Reason is required' },
        ]
    };
    start: Moment = moment();
    end: Moment = moment();
    minStartDate: Moment = moment();
    minEndDate: Moment = moment();
    maxStartDate: Moment;
    late = false;
    datesValid = false;
    invalidMessage = '';
    submitting = false;
    mobile = false;

    constructor(
        private dialog: MatDialog,
        private formbuilder: FormBuilder,
        private httpClient: HttpClient,
        private urlService: UrlService) {
        this.form = this.formbuilder.group({
            reason: ['', Validators.required],
            start: [{ value: '', disabled: true }, Validators.required],
            end: [{ value: '', disabled: true }, Validators.required],
            emergency: [''],
            late: ['']
        });
        this.form.controls['start'].valueChanges.subscribe(_ => {
            this.datesValid = this.validateDates();
        });
        this.form.controls['end'].valueChanges.subscribe(_ => {
            this.datesValid = this.validateDates();
        });
    }

    ngOnInit() {
        this.mobile = window.screen.width < 400 || window.screen.height < 500;
    }

    @HostListener('window:resize')
    onResize() {
        this.mobile = window.screen.width < 400 || window.screen.height < 500;
    }

    validateDates() {
        this.setTimeValues();
        const nowNoTime = moment.utc().hours(0).minutes(0).seconds(0).milliseconds(0);
        if (this.start) {
            const startNoTime = this.start.clone().hours(0).minutes(0).seconds(0).milliseconds(0);
            this.minEndDate = moment(startNoTime);
            if (startNoTime.isBefore(nowNoTime)) {
                this.invalidMessage = 'Start date cannot be in the past';
                return false;
            } else if (startNoTime.isSame(nowNoTime) && ((this.start.day() === 6 || this.start.day() === 3) && moment.utc().hour() >= 12)) {
                this.late = true;
            } else {
                this.late = false;
                this.form.controls['emergency'].setValue(false);
            }
        } else {
            return false;
        }
        if (this.end) {
            const endNoTime = this.end.clone().hours(0).minutes(0).seconds(0).milliseconds(0);
            this.maxStartDate = moment(endNoTime);
            if (endNoTime.isBefore(nowNoTime)) {
                this.invalidMessage = 'End date cannot be in the past';
                return false;
            }
            if (this.start) {
                const startNoTime = this.start.clone().hours(0).minutes(0).seconds(0).milliseconds(0);
                if (endNoTime.isBefore(startNoTime)) {
                    this.invalidMessage = 'End date cannot be before start date';
                    return false;
                }
            }
        } else {
            return false;
        }
        this.invalidMessage = '';
        return true;
    }

    private setTimeValues() {
        this.start = this.form.controls['start'].value;
        this.end = this.form.controls['end'].value;
        if (this.start) {
            this.start.hours(0).minutes(0).seconds(0).milliseconds(0);
        }
        if (this.end) {
            this.end.hours(23).minutes(59).seconds(59).milliseconds(0);
        }
    }

    submit() {
        if (this.submitting) { return; }
        this.submitting = true;
        this.setTimeValues();
        this.form.value['start'] = this.start;
        this.form.value['end'] = this.end;
        this.form.controls['late'].setValue(this.late);
        const formString = JSON.stringify(this.form.getRawValue()).replace(/\n|\r/g, '');
        this.httpClient.put(this.urlService.apiUrl + '/commandrequests/create/loa', formString, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(_ => {
            this.dialog.closeAll();
        }, error => {
            this.dialog.open(MessageModalComponent, {
                data: { message: error.error }
            }).afterClosed().subscribe(() => {
                this.submitting = false;
            });
        });
    }
}
