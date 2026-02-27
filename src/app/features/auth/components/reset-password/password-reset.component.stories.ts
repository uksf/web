import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PasswordResetComponent } from './password-reset.component';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionsService } from '@app/core/services/permissions.service';
import { of } from 'rxjs';

const meta: Meta<PasswordResetComponent> = {
    title: 'Auth/PasswordReset',
    component: PasswordResetComponent,
    decorators: [
        moduleMetadata({
            imports: [FormsModule, MatCheckboxModule],
            declarations: [PasswordResetComponent],
            providers: [
                { provide: AuthenticationService, useValue: {} },
                { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
                { provide: PermissionsService, useValue: {} },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} }, queryParams: of({}) } }
            ]
        })
    ],
    args: {
        resetPasswordCode: 'mock-reset-code'
    }
};
export default meta;
type Story = StoryObj<PasswordResetComponent>;

export const Default: Story = {};

export const Filled: Story = {
    render: (args) => ({
        props: {
            ...args,
            model: { name: null, email: 'user@example.com', password: 'newpassword123', confirmPassword: 'newpassword123' }
        }
    })
};
