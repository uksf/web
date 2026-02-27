import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, Router } from '@angular/router';
import { of, EMPTY } from 'rxjs';
import { LoginPageComponent } from './login-page.component';
import { LoginComponent } from '../login/login.component';
import { RequestPasswordResetComponent } from '../request-password-reset/request-password-reset.component';
import { PasswordResetComponent } from '../reset-password/password-reset.component';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { RedirectService } from '@app/core/services/authentication/redirect.service';

const mockRouter = {
    navigate: () => Promise.resolve(true),
    navigateByUrl: () => Promise.resolve(true),
    events: EMPTY
};

const baseProviders = [
    { provide: AuthenticationService, useValue: {} },
    { provide: Router, useValue: mockRouter },
    { provide: PermissionsService, useValue: {} },
    { provide: RedirectService, useValue: {} }
];

const meta: Meta<LoginPageComponent> = {
    title: 'Auth/LoginPage',
    component: LoginPageComponent,
    decorators: [
        moduleMetadata({
            imports: [FormsModule, MatCardModule, MatCheckboxModule],
            declarations: [LoginPageComponent, LoginComponent, RequestPasswordResetComponent, PasswordResetComponent],
            providers: [
                ...baseProviders,
                { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} }, queryParams: of({}) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<LoginPageComponent>;

export const LoginMode: Story = {};

export const RequestResetMode: Story = {
    render: (args) => ({
        props: {
            ...args,
            mode: 1
        }
    })
};

export const ResetMode: Story = {
    decorators: [
        moduleMetadata({
            providers: [
                ...baseProviders,
                { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { reset: 'mock-code' } }, queryParams: of({}) } }
            ]
        })
    ]
};
