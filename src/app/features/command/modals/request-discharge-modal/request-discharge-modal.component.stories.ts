import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

const meta: Meta = {
    title: 'Modals/RequestDischarge',
    decorators: [moduleMetadata({ imports: [FormsModule, MatDialogModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.mat-mdc-dialog-content { min-width: 600px; } .mat-mdc-dialog-content app-text-input { display: block; width: 100%; }`];

const makeAccounts = (): BehaviorSubject<IDropdownElement[]> => {
    const accounts: IDropdownElement[] = [
        { value: '1', displayValue: 'Tpr. John Smith', data: null, disabled: false },
        { value: '2', displayValue: 'Pte. Jane Doe', data: null, disabled: false },
        { value: '3', displayValue: 'Cpl. Bob Wilson', data: null, disabled: false }
    ];
    const subject = new BehaviorSubject<IDropdownElement[]>(accounts);
    subject.complete();
    return subject;
};

const validationMessages = {
    reason: [{ type: 'required', message: () => 'A discharge reason is required' }]
};

const requestTemplate = `
    <h2 mat-dialog-title>Discharge Request</h2>
    <mat-dialog-content>
        <form #form="ngForm">
            <app-dropdown
                [(ngModel)]="model.account"
                [elementName]="'Recipient'"
                [elements]="accounts"
                [isRequired]="true"
                [placeholder]="'Select recipient'"
                name="formAccount"
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
            model: { account: null, reason: null },
            accounts: makeAccounts(),
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
                account: { value: '1', displayValue: 'Tpr. John Smith', data: null, disabled: false },
                reason: 'Member has requested voluntary discharge due to personal commitments.'
            },
            accounts: makeAccounts(),
            validationMessages
        },
        styles,
        template: requestTemplate
    })
};
