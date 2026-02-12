import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { of } from 'rxjs';
import { InlineDropdownComponent } from './inline-dropdown.component';
import { IDropdownElement } from '../dropdown-base/dropdown-base.component';

const mockElements: IDropdownElement[] = [
    { value: '1', displayValue: 'Private' },
    { value: '2', displayValue: 'Corporal' },
    { value: '3', displayValue: 'Sergeant' },
    { value: '4', displayValue: 'Lieutenant' }
];

const meta: Meta<InlineDropdownComponent> = {
    title: 'Shared/InlineDropdown',
    component: InlineDropdownComponent,
    decorators: [
        moduleMetadata({
            imports: [FormsModule]
        })
    ]
};
export default meta;

type Story = StoryObj<InlineDropdownComponent>;

export const Default: Story = {
    render: (args) => ({
        props: {
            ...args,
            elements: of(mockElements),
            editValue: 'Sergeant',
            mapElementName: (el: IDropdownElement) => el.displayValue
        },
        template: `
            <app-inline-dropdown
                [label]="label"
                [placeholder]="placeholder"
                [elements]="elements"
                [elementName]="elementName"
                [mapElementName]="mapElementName"
                [(ngModel)]="editValue"
            ></app-inline-dropdown>
        `
    }),
    args: {
        label: 'Rank',
        placeholder: 'Select a rank',
        elementName: 'rank'
    }
};

export const Editing: Story = {
    render: (args) => ({
        props: {
            ...args,
            elements: of(mockElements),
            editValue: '',
            mapElementName: (el: IDropdownElement) => el.displayValue
        },
        template: `
            <app-inline-dropdown
                [label]="label"
                [placeholder]="placeholder"
                [elements]="elements"
                [elementName]="elementName"
                [mapElementName]="mapElementName"
                [(ngModel)]="editValue"
            ></app-inline-dropdown>
        `
    }),
    args: {
        label: 'Rank',
        placeholder: 'Select a rank',
        elementName: 'rank'
    }
};
