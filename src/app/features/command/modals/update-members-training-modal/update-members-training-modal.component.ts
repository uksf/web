import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatDialog, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { NgForm, FormsModule } from '@angular/forms';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { SelectionListComponent } from '@app/shared/components/elements/selection-list/selection-list.component';
import { AutofocusStopComponent } from '@app/shared/components/elements/autofocus-stop/autofocus-stop.component';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { BasicAccount } from '@app/shared/models/account';
import { MembersService } from '@app/shared/services/members.service';
import { Training } from '@app/features/command/models/training';
import { TrainingsService } from '../../services/trainings.service';

@Component({
    selector: 'app-update-members-training-modal',
    templateUrl: './update-members-training-modal.component.html',
    styleUrls: ['./update-members-training-modal.component.scss', '../../components/command-page/command-page.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, MatDialogContent, FormsModule, MatRadioGroup, MatRadioButton, SelectionListComponent, MatDialogActions, ButtonComponent]
})
export class UpdateMembersTrainingModalComponent implements OnInit {
    private dialog = inject(MatDialog);
    private membersService = inject(MembersService);
    private trainingsService = inject(TrainingsService);

    @ViewChild(NgForm) form!: NgForm;
    pending = false;
    model: FormModel = { accounts: [], trainings: [], remove: false };
    accounts = new BehaviorSubject<IDropdownElement[]>([]);
    trainings = new BehaviorSubject<IDropdownElement[]>([]);

    ngOnInit() {
        this.membersService
            .getMembers()
            .pipe(first())
            .subscribe({ next: (accounts: BasicAccount[]) => this.accounts.next(accounts.map(BasicAccount.mapToElement)) });

        this.trainingsService
            .getTrainings()
            .pipe(first())
            .subscribe({ next: (trainings: Training[]) => this.trainings.next(trainings.map((training) => ({ value: training.id, displayValue: training.name }))) });
    }

    submit() {
        if (!this.form.valid || this.pending || !this.model.accounts.length || !this.model.trainings.length) {
            return;
        }

        this.pending = true;
        this.trainingsService
            .bulkUpdateAccountTrainings(
                this.model.accounts.map((element) => element.value),
                this.model.trainings.map((element) => element.value),
                this.model.remove
            )
            .pipe(first())
            .subscribe({
                next: () => {
                    this.pending = false;
                    this.dialog.closeAll();
                },
                error: (error) => {
                    this.pending = false;
                    this.dialog.closeAll();
                    this.dialog.open(MessageModalComponent, { data: { message: error.error } });
                }
            });
    }
}

interface FormModel {
    accounts: IDropdownElement[];
    trainings: IDropdownElement[];
    remove: boolean;
}
