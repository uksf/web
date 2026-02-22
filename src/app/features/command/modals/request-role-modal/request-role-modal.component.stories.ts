import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

const meta: Meta = {
    title: 'Modals/RequestRole',
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

const makeRoles = (): BehaviorSubject<IDropdownElement[]> => {
    const roles: IDropdownElement[] = [
        { value: '1', displayValue: 'Medic', data: 'Medic', disabled: false },
        { value: '2', displayValue: 'Signaller', data: 'Signaller', disabled: false },
        { value: '3', displayValue: 'Engineer', data: 'Engineer', disabled: false },
        { value: '4', displayValue: 'JTAC', data: 'JTAC', disabled: false }
    ];
    return new BehaviorSubject<IDropdownElement[]>(roles);
};

const validationMessages = {
    reason: [{ type: 'required', message: () => 'A reason for the role change is required' }]
};

const requestTemplate = `
    <h2 mat-dialog-title>Role Request</h2>
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
                [(ngModel)]="model.role"
                [elementName]="'Role'"
                [elements]="roles"
                [isRequired]="true"
                [placeholder]="'Select new role'"
                name="formRole"
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
            model: { accounts: [], role: null, reason: null },
            accounts: makeAccounts(),
            roles: makeRoles(),
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
                accounts: [{ value: '2', displayValue: 'Pte. Jane Doe', data: null, disabled: false }],
                role: { value: '1', displayValue: 'Medic', data: 'Medic', disabled: false },
                reason: 'Completed medical training course and passed assessment.'
            },
            accounts: makeAccounts(),
            roles: makeRoles(),
            validationMessages
        },
        styles,
        template: requestTemplate
    })
};
