import type { Meta, StoryObj } from '@storybook/angular';
import { LoadingPlaceholderComponent } from './loading-placeholder.component';

const meta: Meta<LoadingPlaceholderComponent> = {
    title: 'Shared/LoadingPlaceholder',
    component: LoadingPlaceholderComponent
};
export default meta;

type Story = StoryObj<LoadingPlaceholderComponent>;

export const Loading: Story = {
    render: (args) => ({
        props: args,
        template: `
            <app-loading-placeholder [loading]="loading" [width]="width" [height]="height">
                <ng-template #element>Loaded content</ng-template>
            </app-loading-placeholder>
        `
    }),
    args: {
        loading: true,
        width: '120px',
        height: '16px'
    }
};

export const Loaded: Story = {
    render: (args) => ({
        props: args,
        template: `
            <app-loading-placeholder [loading]="loading" [width]="width" [height]="height">
                <ng-template #element>Loaded content</ng-template>
            </app-loading-placeholder>
        `
    }),
    args: {
        loading: false,
        width: '120px',
        height: '16px'
    }
};
