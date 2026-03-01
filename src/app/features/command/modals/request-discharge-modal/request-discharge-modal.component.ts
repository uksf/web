import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatDialog, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { NgForm, FormsModule } from '@angular/forms';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { BasicAccount } from '@app/shared/models/account';
import { CommandRequest } from '@app/features/command/models/command-request';
import { IDropdownElement, mapFromElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { MembersService } from '@app/shared/services/members.service';
import { CommandRequestsService } from '../../services/command-requests.service';
import { AutofocusStopComponent } from '../../../../shared/components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DropdownComponent } from '../../../../shared/components/elements/dropdown/dropdown.component';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';
import { TemplateFormValueDebugComponent } from '../../../../shared/components/elements/form-value-debug/form-value-debug.component';

@Component({
    selector: 'app-request-discharge-modal',
    templateUrl: './request-discharge-modal.component.html',
    styleUrls: ['./request-discharge-modal.component.scss', '../../components/command-page/command-page.component.scss'],
    imports: [
        AutofocusStopComponent,
        MatDialogTitle,
        CdkScrollable,
        MatDialogContent,
        FormsModule,
        FlexFillerComponent,
        MatProgressSpinner,
        DropdownComponent,
        TextInputComponent,
        MatDialogActions,
        ButtonComponent,
        TemplateFormValueDebugComponent
    ]
})
export class RequestDischargeModalComponent implements OnInit {
    private dialog = inject(MatDialog);
    private membersService = inject(MembersService);
    private commandRequestsService = inject(CommandRequestsService);

    @ViewChild(NgForm) form!: NgForm;
    pending = false;
    model: FormModel = {
        account: null,
        reason: null
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A discharge reason is required' }]
    };

    ngOnInit(): void {
        this.membersService
            .getMembers(true)
            .pipe(first())
            .subscribe({
                next: (accounts: BasicAccount[]) => {
                    this.accounts.next(accounts.map(BasicAccount.mapToElement));
                    this.accounts.complete();
                }
            });
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        const commandRequest: CommandRequest = {
            recipient: mapFromElement(BasicAccount, this.model.account).id,
            reason: this.model.reason
        };

        this.pending = true;
        this.commandRequestsService
            .createDischarge(commandRequest)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.dialog.closeAll();
                    this.pending = false;
                },
                error: (error) => {
                    this.dialog.closeAll();
                    this.pending = false;
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                }
            });
    }

    getAccountName(element: IDropdownElement): string {
        return mapFromElement(BasicAccount, element).displayName;
    }
}

interface FormModel {
    account: IDropdownElement;
    reason: string;
}
