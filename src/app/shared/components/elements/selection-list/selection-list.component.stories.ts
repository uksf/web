import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { of } from 'rxjs';
import { SelectionListComponent } from './selection-list.component';
import { IDropdownElement } from '../dropdown-base/dropdown-base.component';

const mockElements: IDropdownElement[] = [
    { value: '1', displayValue: 'Rifleman' },
    { value: '2', displayValue: 'Medic' },
    { value: '3', displayValue: 'Engineer' },
    { value: '4', displayValue: 'Marksman' },
    { value: '5', displayValue: 'Grenadier' }
];

const meta: Meta<SelectionListComponent> = {
    title: 'Shared/SelectionList',
    component: SelectionListComponent,
    decorators: [
        moduleMetadata({
            imports: [FormsModule, ReactiveFormsModule]
        })
    ]
};
export default meta;

type Story = StoryObj<SelectionListComponent>;

export const Default: Story = {
    render: (args) => {
        const form = new UntypedFormGroup({
            roles: new UntypedFormControl([])
        });
        return {
            props: { ...args, elements: of(mockElements), form, selectedItems: [] },
            template: `
                <form [formGroup]="form">
                    <app-selection-list
                        [placeholder]="placeholder"
                        [elements]="elements"
                        [elementName]="elementName"
                        formControlName="roles"
                    >
                        <ng-template #element let-element>{{ element.displayValue }}</ng-template>
                    </app-selection-list>
                </form>
            `
        };
    },
    args: {
        placeholder: 'Search roles',
        elementName: 'role'
    }
};

export const MultiSelected: Story = {
    render: (args) => {
        const preSelected = [mockElements[0], mockElements[2]];
        const form = new UntypedFormGroup({
            roles: new UntypedFormControl(preSelected)
        });
        return {
            props: { ...args, elements: of(mockElements), form },
            template: `
                <form [formGroup]="form">
                    <app-selection-list
                        [placeholder]="placeholder"
                        [elements]="elements"
                        [elementName]="elementName"
                        formControlName="roles"
                    >
                        <ng-template #element let-element>{{ element.displayValue }}</ng-template>
                    </app-selection-list>
                </form>
            `
        };
    },
    args: {
        placeholder: 'Search roles',
        elementName: 'role'
    }
};
