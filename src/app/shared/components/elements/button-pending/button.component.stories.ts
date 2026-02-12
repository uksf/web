import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
    title: 'Shared/ButtonPending',
    component: ButtonComponent
};
export default meta;

type Story = StoryObj<ButtonComponent>;

export const Default: Story = {
    render: (args) => ({
        props: args,
        template: `<app-button [pending]="pending" [disabled]="disabled">Submit</app-button>`
    }),
    args: {
        pending: false,
        disabled: false
    }
};

export const Pending: Story = {
    render: (args) => ({
        props: args,
        template: `<app-button [pending]="pending" [disabled]="disabled">Submit</app-button>`
    }),
    args: {
        pending: true,
        disabled: false
    }
};

export const Disabled: Story = {
    render: (args) => ({
        props: args,
        template: `<app-button [pending]="pending" [disabled]="disabled">Submit</app-button>`
    }),
    args: {
        pending: false,
        disabled: true
    }
};
