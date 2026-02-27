import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoginComponent } from './login.component';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { Router } from '@angular/router';
import { PermissionsService } from '@app/core/services/permissions.service';
import { RedirectService } from '@app/core/services/authentication/redirect.service';

const meta: Meta<LoginComponent> = {
    title: 'Auth/Login',
    component: LoginComponent,
    decorators: [
        moduleMetadata({
            imports: [FormsModule, MatCheckboxModule],
            declarations: [LoginComponent],
            providers: [
                { provide: AuthenticationService, useValue: {} },
                { provide: Router, useValue: {} },
                { provide: PermissionsService, useValue: {} },
                { provide: RedirectService, useValue: {} }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<LoginComponent>;

export const Empty: Story = {};

export const Filled: Story = {
    render: (args) => ({
        props: {
            ...args,
            model: { name: null, email: 'user@example.com', password: 'mypassword' }
        }
    })
};

export const Error: Story = {
    render: (args) => ({
        props: {
            ...args,
            model: { name: null, email: 'user@example.com', password: 'wrongpassword' },
            loginError: 'Invalid email or password'
        }
    })
};

export const Pending: Story = {
    render: (args) => ({
        props: {
            ...args,
            model: { name: null, email: 'user@example.com', password: 'mypassword' },
            pending: true
        }
    })
};
