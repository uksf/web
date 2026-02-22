import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

const meta: Meta = {
    title: 'Modals/RequestRank',
    decorators: [moduleMetadata({ imports: [FormsModule, MatDialogModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.mat-mdc-dialog-content { min-width: 600px; } .mat-mdc-dialog-content app-text-input { display: block; width: 100%; }`];

const makeAccounts = (): BehaviorSubject<IDropdownElement[]> => {
    const accounts: IDropdownElement[] = [
        { value: '1', displayValue: 'Tpr. John Smith', data: 'Tpr', disabled: false },
        { value: '2', displayValue: 'Pte. Jane Doe', data: 'Pte', disabled: false },
        { value: '3', displayValue: 'Cpl. Bob Wilson', data: 'Cpl', disabled: false }
    ];
    const subject = new BehaviorSubject<IDropdownElement[]>(accounts);
    subject.complete();
    return subject;
};

const makeRanks = (): BehaviorSubject<IDropdownElement[]> => {
    const ranks: IDropdownElement[] = [
        { value: '1', displayValue: 'Trooper', data: 'Tpr', disabled: false },
        { value: '2', displayValue: 'Private', data: 'Pte', disabled: false },
        { value: '3', displayValue: 'Corporal', data: 'Cpl', disabled: false },
        { value: '4', displayValue: 'Sergeant', data: 'Sgt', disabled: false },
        { value: '5', displayValue: 'Staff Sergeant', data: 'SSgt', disabled: false }
    ];
    return new BehaviorSubject<IDropdownElement[]>(ranks);
};

const validationMessages = {
    reason: [{ type: 'required', message: () => 'A reason for the promotion/demotion is required' }]
};

const requestTemplate = `
    <h2 mat-dialog-title>Promotion/Demotion Request</h2>
    <mat-dialog-content>
        <form #form="ngForm">
            <app-selection-list
                [(ngModel)]="model.accounts"
                [elementName]="'Recipient'"
                [elements]="accounts"
                [clearOnSelect]="true"
                [placeholder]="'Add recipient'"
                name="formAccountList"
            >
                <ng-template #element let-element>
                    {{ element.displayValue }}
                </ng-template>
            </app-selection-list>
            <app-dropdown
                [(ngModel)]="model.rank"
                [elementName]="'Rank'"
                [elements]="ranks"
                [isRequired]="true"
                [placeholder]="'Select new rank'"
                name="formRank"
            >
                <ng-template #element let-element>
                    {{ element.displayValue }}
                </ng-template>
            </app-dropdown>
            <app-text-input label="Reason" [(ngModel)]="model.reason" name="formReason"
                [multiline]="true" [minRows]="1" [maxRows]="5" [required]="true"
                [validationMessages]="validationMessages.reason">
            </app-text-input>
        </form>
    </mat-dialog-content>
    <mat-dialog-actions>
        <app-button [disabled]="!form.valid">Submit</app-button>
    </mat-dialog-actions>
`;

export const Default: Story = {
    render: () => ({
        props: {
            model: { accounts: [], rank: null, reason: null },
            accounts: makeAccounts(),
            ranks: makeRanks(),
            validationMessages
        },
        styles,
        template: requestTemplate
    })
};

export const WithSelection: Story = {
    render: () => ({
        props: {
            model: {
                accounts: [{ value: '1', displayValue: 'Tpr. John Smith', data: 'Tpr', disabled: false }],
                rank: { value: '4', displayValue: 'Sergeant', data: 'Sgt', disabled: false },
                reason: 'Outstanding performance in recent operations and leadership capability.'
            },
            accounts: makeAccounts(),
            ranks: makeRanks(),
            validationMessages
        },
        styles,
        template: requestTemplate
    })
};
