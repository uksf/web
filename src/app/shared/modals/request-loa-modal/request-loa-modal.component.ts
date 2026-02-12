import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { ValidationMessage } from '@app/shared/services/form-helper.service';
import { CommandRequestsService } from '@app/features/command/services/command-requests.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import moment, { Moment } from 'moment';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-request-loa-modal',
    templateUrl: './request-loa-modal.component.html',
    styleUrls: ['./request-loa-modal.component.scss']
})
export class RequestLoaModalComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    form = this.formBuilder.group({
        reason: ['', Validators.required],
        start: [null as Moment, Validators.required],
        end: [null as Moment, Validators.required],
        emergency: [false],
        late: [false]
    });
    validationMessages: { reason: ValidationMessage[] } = {
        reason: [{ type: 'required', message: 'Reason is required' }]
    };
    start: Moment = this.getUkNow();
    end: Moment = this.getUkNow();
    minStartDate: Moment = this.getUkNow();
    minEndDate: Moment = this.getUkNow();
    maxStartDate: Moment;
    late = false;
    datesValid = false;
    invalidMessage = '';
    submitting = false;
    mobile = false;

    constructor(private dialog: MatDialog, private formBuilder: FormBuilder, private commandRequestsService: CommandRequestsService) {
        this.form.controls.start.valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
            next: (_) => {
                this.datesValid = this.validateDates();
            }
        });
        this.form.controls.end.valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
            next: (_) => {
                this.datesValid = this.validateDates();
            }
        });
    }

    ngOnInit() {
        this.mobile = window.screen.width < 400 || window.screen.height < 500;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    @HostListener('window:resize')
    onResize() {
        this.mobile = window.screen.width < 400 || window.screen.height < 500;
    }

    validateDates() {
        this.setTimeValues();
        const nowUk = this.getUkNow();
        const nowNoTime = nowUk.clone().hours(0).minutes(0).seconds(0).milliseconds(0);

        if (this.start) {
            const startNoTime = this.start.clone().hours(0).minutes(0).seconds(0).milliseconds(0);
            this.minEndDate = moment(startNoTime);
            if (startNoTime.isBefore(nowNoTime)) {
                this.invalidMessage = 'Start date cannot be in the past';
                return false;
            } else if (startNoTime.isSame(nowNoTime) && (this.start.day() === 6 || this.start.day() === 3) && nowUk.hour() >= 12) {
                this.late = true;
            } else {
                this.late = false;
                this.form.controls.emergency.setValue(false);
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
        this.start = this.form.controls.start.value;
        this.end = this.form.controls.end.value;
        if (this.start) {
            this.start.hours(0).minutes(0).seconds(0).milliseconds(0);
        }
        if (this.end) {
            this.end.hours(23).minutes(59).seconds(59).milliseconds(0);
        }
    }

    submit() {
        if (this.submitting) {
            return;
        }
        this.submitting = true;
        this.setTimeValues();
        this.form.controls.late.setValue(this.late);
        const body = {
            reason: this.form.controls.reason.value,
            start: this.start,
            end: this.end,
            emergency: this.form.controls.emergency.value,
            late: this.late
        };
        this.commandRequestsService
            .createLoa(body)
            .pipe(first())
            .subscribe({
                next: (_) => {
                    this.dialog.closeAll();
                },
                error: (error) => {
                    this.dialog
                        .open(MessageModalComponent, {
                            data: { message: error.error }
                        })
                        .afterClosed()
                        .pipe(first())
                        .subscribe({
                            next: () => {
                                this.submitting = false;
                            }
                        });
                }
            });
    }

    trackByIndex(index: number): number {
        return index;
    }

    private getUkNow() {
        return moment().tz('Europe/London');
    }
}
