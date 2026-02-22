import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

const meta: Meta = {
    title: 'Modals/RequestChainOfCommandPosition',
    decorators: [moduleMetadata({ imports: [FormsModule, MatDialogModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.mat-mdc-dialog-content { min-width: 600px; } .mat-mdc-dialog-content app-text-input { display: block; width: 100%; }`];

const makeAccounts = (): BehaviorSubject<IDropdownElement[]> => {
    const accounts: IDropdownElement[] = [
        { value: '1', displayValue: 'Sgt. John Smith', data: null, disabled: false },
        { value: '2', displayValue: 'SSgt. Jane Doe', data: null, disabled: false },
        { value: '3', displayValue: 'Cpl. Bob Wilson', data: null, disabled: false }
    ];
    const subject = new BehaviorSubject<IDropdownElement[]>(accounts);
    subject.complete();
    return subject;
};

const makeUnits = (hasItems = false): BehaviorSubject<IDropdownElement[]> => {
    const units: IDropdownElement[] = hasItems
        ? [
              { value: '1', displayValue: '1 Troop', data: '1 Troop', disabled: false },
              { value: '2', displayValue: '2 Troop', data: '2 Troop', disabled: false },
              { value: '3', displayValue: '1 Squadron', data: '1 Squadron', disabled: false }
          ]
        : [];
    return new BehaviorSubject<IDropdownElement[]>(units);
};

const makePositions = (hasItems = false): BehaviorSubject<IDropdownElement[]> => {
    const positions: IDropdownElement[] = hasItems
        ? [
              { value: '1', displayValue: 'Troop Commander', data: 'Troop Commander', disabled: false },
              { value: '2', displayValue: '2IC', data: '2IC', disabled: false },
              { value: '3', displayValue: 'Troop Sergeant', data: 'Troop Sergeant', disabled: false }
          ]
        : [];
    return new BehaviorSubject<IDropdownElement[]>(positions);
};

const validationMessages = {
    reason: [{ type: 'required', message: () => 'A reason for the position change is required' }]
};

const requestTemplate = `
    <h2 mat-dialog-title>Chain of Command Position Request</h2>
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
            <app-dropdown
                [(ngModel)]="model.unit"
                [elementName]="'Unit'"
                [elements]="units"
                [isDisabled]="units.value.length === 0"
                [isRequired]="true"
                [placeholder]="'Select unit'"
                name="formUnit"
            >
                <ng-template #element let-element>
                    {{ element.displayValue }}
                </ng-template>
            </app-dropdown>
            <app-dropdown
                [(ngModel)]="model.position"
                [elementName]="'Position'"
                [elements]="positions"
                [isDisabled]="positions.value.length === 0"
                [isRequired]="true"
                [placeholder]="'Select new position'"
                name="formPosition"
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
            model: { account: null, unit: null, position: null, reason: null },
            accounts: makeAccounts(),
            units: makeUnits(),
            positions: makePositions(),
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
                account: { value: '1', displayValue: 'Sgt. John Smith', data: null, disabled: false },
                unit: { value: '1', displayValue: '1 Troop', data: '1 Troop', disabled: false },
                position: { value: '1', displayValue: 'Troop Commander', data: 'Troop Commander', disabled: false },
                reason: 'Promoted to lead 1 Troop following previous commander transfer.'
            },
            accounts: makeAccounts(),
            units: makeUnits(true),
            positions: makePositions(true),
            validationMessages
        },
        styles,
        template: requestTemplate
    })
};
