import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { RequestPasswordResetComponent } from './request-password-reset.component';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';

const meta: Meta<RequestPasswordResetComponent> = {
    title: 'Auth/RequestPasswordReset',
    component: RequestPasswordResetComponent,
    decorators: [
        moduleMetadata({
            imports: [FormsModule],
            declarations: [RequestPasswordResetComponent],
            providers: [
                { provide: AuthenticationService, useValue: {} }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<RequestPasswordResetComponent>;

export const Default: Story = {};

export const Sent: Story = {
    render: (args) => ({
        props: {
            ...args,
            sent: true
        }
    })
};
