import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

const meta: Meta = {
    title: 'Modals/RequestTransfer',
    decorators: [moduleMetadata({ imports: [FormsModule, MatDialogModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.mat-mdc-dialog-content { min-width: 600px; } .mat-mdc-dialog-content app-text-input { display: block; width: 100%; }`];

const makeAccounts = (): BehaviorSubject<IDropdownElement[]> => {
    const accounts: IDropdownElement[] = [
        { value: '1', displayValue: 'Tpr. John Smith', data: '1 Troop', disabled: false },
        { value: '2', displayValue: 'Pte. Jane Doe', data: '2 Troop', disabled: false },
        { value: '3', displayValue: 'Cpl. Bob Wilson', data: 'HQ', disabled: false }
    ];
    const subject = new BehaviorSubject<IDropdownElement[]>(accounts);
    subject.complete();
    return subject;
};

const makeUnits = (): BehaviorSubject<IDropdownElement[]> => {
    const units: IDropdownElement[] = [
        { value: '1', displayValue: '1 Troop', data: '1 Troop', disabled: false },
        { value: '2', displayValue: '2 Troop', data: '2 Troop', disabled: false },
        { value: '3', displayValue: 'HQ', data: 'HQ', disabled: false },
        { value: '4', displayValue: 'Air Troop', data: 'Air Troop', disabled: false }
    ];
    return new BehaviorSubject<IDropdownElement[]>(units);
};

const validationMessages = {
    reason: [{ type: 'required', message: () => 'A reason for the transfer is required' }]
};

const requestTemplate = `
    <h2 mat-dialog-title>Transfer Request</h2>
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
                [(ngModel)]="model.unit"
                [elementName]="'Unit'"
                [elements]="units"
                [isRequired]="true"
                [placeholder]="'Select new unit'"
                name="formUnit"
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
            model: { accounts: [], unit: null, reason: null },
            accounts: makeAccounts(),
            units: makeUnits(),
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
                accounts: [
                    { value: '1', displayValue: 'Tpr. John Smith', data: '1 Troop', disabled: false },
                    { value: '2', displayValue: 'Pte. Jane Doe', data: '2 Troop', disabled: false }
                ],
                unit: { value: '4', displayValue: 'Air Troop', data: 'Air Troop', disabled: false },
                reason: 'Personnel rebalancing between troops.'
            },
            accounts: makeAccounts(),
            units: makeUnits(),
            validationMessages
        },
        styles,
        template: requestTemplate
    })
};
