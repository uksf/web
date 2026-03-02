import { Component, HostListener, OnInit, inject } from '@angular/core';
import { MatDialog, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ValidationMessage } from '@app/shared/services/form-helper.service';
import { CommandRequestsService } from '@app/features/command/services/command-requests.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import moment from 'moment-timezone';
import { first, takeUntil } from 'rxjs/operators';
import { AutofocusStopComponent } from '../../components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { TextInputComponent } from '../../components/elements/text-input/text-input.component';
import { DateInputComponent } from '../../components/elements/date-input/date-input.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import { MatButton } from '@angular/material/button';
import { ReactiveFormValueDebugComponent } from '../../components/elements/form-value-debug/form-value-debug.component';
import { DestroyableComponent } from '@app/shared/components';

@Component({
    selector: 'app-request-loa-modal',
    templateUrl: './request-loa-modal.component.html',
    styleUrls: ['./request-loa-modal.component.scss'],
    imports: [
        AutofocusStopComponent,
        MatDialogTitle,
        CdkScrollable,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        TextInputComponent,
        DateInputComponent,
        MatCheckbox,
        MatTooltip,
        MatDialogActions,
        MatButton,
        ReactiveFormValueDebugComponent
    ]
})
export class RequestLoaModalComponent extends DestroyableComponent implements OnInit {
    private dialog = inject(MatDialog);
    private formBuilder = inject(FormBuilder);
    private commandRequestsService = inject(CommandRequestsService);

    form = this.formBuilder.group({
        reason: ['', Validators.required],
        start: [null as Date | null, Validators.required],
        end: [null as Date | null, Validators.required],
        emergency: [false],
        late: [false]
    });
    validationMessages: { reason: ValidationMessage[] } = {
        reason: [{ type: 'required', message: 'Reason is required' }]
    };
    start: Date | null = null;
    end: Date | null = null;
    minStartDate: Date = this.getUkToday();
    minEndDate: Date = this.getUkToday();
    maxStartDate: Date | null = null;
    late = false;
    datesValid = false;
    invalidMessage = '';
    submitting = false;
    mobile = false;

    constructor() {
        super();
        this.form.controls.start.valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.datesValid = this.validateDates();
            }
        });
        this.form.controls.end.valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.datesValid = this.validateDates();
            }
        });
    }

    ngOnInit() {
        this.mobile = window.screen.width < 400 || window.screen.height < 500;
    }

    @HostListener('window:resize')
    onResize() {
        this.mobile = window.screen.width < 400 || window.screen.height < 500;
    }

    validateDates(): boolean {
        this.start = this.form.controls.start.value;
        this.end = this.form.controls.end.value;

        const nowUk = moment().tz('Europe/London');
        const todayStart = new Date(nowUk.year(), nowUk.month(), nowUk.date());

        if (this.start) {
            const startDay = new Date(this.start.getFullYear(), this.start.getMonth(), this.start.getDate());
            this.minEndDate = new Date(startDay);
            if (startDay < todayStart) {
                this.invalidMessage = 'Start date cannot be in the past';
                return false;
            } else if (startDay.getTime() === todayStart.getTime() && (startDay.getDay() === 6 || startDay.getDay() === 3) && nowUk.hour() >= 12) {
                this.late = true;
            } else {
                this.late = false;
                this.form.controls.emergency.setValue(false);
            }
        } else {
            return false;
        }

        if (this.end) {
            const endDay = new Date(this.end.getFullYear(), this.end.getMonth(), this.end.getDate());
            this.maxStartDate = new Date(endDay);
            if (endDay < todayStart) {
                this.invalidMessage = 'End date cannot be in the past';
                return false;
            }
            if (this.start) {
                const startDay = new Date(this.start.getFullYear(), this.start.getMonth(), this.start.getDate());
                if (endDay < startDay) {
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

    submit() {
        if (this.submitting) {
            return;
        }
        this.submitting = true;
        this.form.controls.late.setValue(this.late);

        const startDate = this.start ? new Date(this.start.getFullYear(), this.start.getMonth(), this.start.getDate(), 0, 0, 0) : null;
        const endDate = this.end ? new Date(this.end.getFullYear(), this.end.getMonth(), this.end.getDate(), 23, 59, 59) : null;

        const body = {
            reason: this.form.controls.reason.value,
            start: startDate,
            end: endDate,
            emergency: this.form.controls.emergency.value,
            late: this.late
        };
        this.commandRequestsService
            .createLoa(body)
            .pipe(first())
            .subscribe({
                next: () => {
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

    private getUkToday(): Date {
        const now = moment().tz('Europe/London');
        return new Date(now.year(), now.month(), now.date());
    }
}
