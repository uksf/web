import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { of } from 'rxjs';
import { DropdownComponent } from './dropdown.component';
import { IDropdownElement } from '../dropdown-base/dropdown-base.component';

const mockElements: IDropdownElement[] = [
    { value: '1', displayValue: 'Alpha' },
    { value: '2', displayValue: 'Bravo' },
    { value: '3', displayValue: 'Charlie' },
    { value: '4', displayValue: 'Delta' },
    { value: '5', displayValue: 'Echo' }
];

const meta: Meta<DropdownComponent> = {
    title: 'Shared/Dropdown',
    component: DropdownComponent,
    decorators: [
        moduleMetadata({
            imports: [FormsModule, ReactiveFormsModule],
            declarations: []
        })
    ]
};
export default meta;

type Story = StoryObj<DropdownComponent>;

export const Default: Story = {
    render: (args) => ({
        props: { ...args, elements$: of(mockElements), selectedValue: null },
        template: `
            <form ngForm>
                <app-dropdown
                    placeholder="Select a unit"
                    [elements]="elements$"
                    elementName="unit"
                    [(ngModel)]="selectedValue"
                    name="unit"
                >
                    <ng-template #element let-element>{{ element.displayValue }}</ng-template>
                </app-dropdown>
            </form>
        `
    })
};

export const Required: Story = {
    render: (args) => ({
        props: { ...args, elements$: of(mockElements), selectedValue: null },
        template: `
            <form ngForm>
                <app-dropdown
                    placeholder="Select a unit (required)"
                    [elements]="elements$"
                    elementName="unit"
                    [isRequired]="true"
                    [(ngModel)]="selectedValue"
                    name="unit"
                >
                    <ng-template #element let-element>{{ element.displayValue }}</ng-template>
                </app-dropdown>
            </form>
        `
    })
};
