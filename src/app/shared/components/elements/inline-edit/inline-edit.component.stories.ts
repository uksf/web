import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { InlineEditComponent } from './inline-edit.component';

const meta: Meta<InlineEditComponent> = {
    title: 'Shared/InlineEdit',
    component: InlineEditComponent,
    decorators: [
        moduleMetadata({
            imports: [FormsModule]
        })
    ]
};
export default meta;

type Story = StoryObj<InlineEditComponent>;

export const Default: Story = {
    render: (args) => ({
        props: { ...args, editValue: 'Sgt. Smith' },
        template: `<app-inline-edit [label]="label" [disabled]="disabled" [(ngModel)]="editValue"></app-inline-edit>`
    }),
    args: {
        label: 'Name',
        disabled: false
    }
};

export const Disabled: Story = {
    render: (args) => ({
        props: { ...args, editValue: 'Sgt. Smith' },
        template: `<app-inline-edit [label]="label" [disabled]="disabled" [(ngModel)]="editValue"></app-inline-edit>`
    }),
    args: {
        label: 'Name',
        disabled: true
    }
};

export const Empty: Story = {
    render: (args) => ({
        props: { ...args, editValue: '' },
        template: `<app-inline-edit [label]="label" [disabled]="disabled" [(ngModel)]="editValue"></app-inline-edit>`
    }),
    args: {
        label: 'Name',
        disabled: false
    }
};
