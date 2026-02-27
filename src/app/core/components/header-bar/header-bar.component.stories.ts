import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderBarComponent } from './header-bar.component';
import { CoreModule } from '@app/core/core.module';
import { PermissionsService } from '@app/core/services/permissions.service';
import { AccountService } from '@app/core/services/account.service';
import { AppSettingsService, Environments } from '@app/core/services/app-settings.service';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { SignalRService } from '@app/core/services/signalr.service';
import { NotificationsService } from '@app/core/services/notifications.service';
import { Account, MembershipState } from '@app/shared/models/account';

const mockAccount: Account = {
    id: '1',
    displayName: 'Sgt.Miller.B',
    membershipState: MembershipState.MEMBER,
    email: 'test@test.com',
    firstname: 'Bob',
    lastname: 'Miller',
    rank: 'Sergeant',
    unitAssignment: 'UKSF',
    roleAssignment: 'Trooper',
} as Account;

const mockSignalRService = {
    connect: () => ({
        connection: { on: () => {}, off: () => {}, stop: () => Promise.resolve() },
        reconnectEvent: new Subject<void>(),
        dispose: () => {}
    })
};

function commonProviders(account: Account | null, environment: string) {
    return [
        { provide: PermissionsService, useValue: { revoke: () => {}, getPermissions: () => ({}) } },
        { provide: AccountService, useValue: { account, accountChange$: new Subject<Account>() } },
        { provide: AppSettingsService, useValue: { appSetting: (key: string) => key === 'environment' ? environment : '' } },
        { provide: AuthenticationService, useValue: { isImpersonated: () => false } },
        { provide: SignalRService, useValue: mockSignalRService },
        { provide: NotificationsService, useValue: { getNotifications: () => of([]) } }
    ];
}

const meta: Meta<HeaderBarComponent> = {
    title: 'Layout/HeaderBar',
    component: HeaderBarComponent,
    decorators: [
        moduleMetadata({
            imports: [CoreModule, RouterTestingModule, NgxPermissionsModule.forRoot()],
            providers: commonProviders(mockAccount, Environments.Production)
        })
    ]
};
export default meta;
type Story = StoryObj<HeaderBarComponent>;

export const LoggedIn: Story = {
    decorators: [
        moduleMetadata({
            providers: commonProviders(mockAccount, Environments.Production)
        }),
        (story, context) => {
            const ngxPermissions = context.injector?.get(NgxPermissionsService);
            ngxPermissions?.loadPermissions(['MEMBER', 'CONFIRMED']);
            return story();
        }
    ]
};

export const Development: Story = {
    decorators: [
        moduleMetadata({
            providers: commonProviders(mockAccount, Environments.Development)
        }),
        (story, context) => {
            const ngxPermissions = context.injector?.get(NgxPermissionsService);
            ngxPermissions?.loadPermissions(['MEMBER', 'CONFIRMED']);
            return story();
        }
    ]
};

export const NotLoggedIn: Story = {
    decorators: [
        moduleMetadata({
            providers: commonProviders(null, Environments.Production)
        }),
        (story, context) => {
            const ngxPermissions = context.injector?.get(NgxPermissionsService);
            ngxPermissions?.loadPermissions(['UNLOGGED']);
            return story();
        }
    ]
};
