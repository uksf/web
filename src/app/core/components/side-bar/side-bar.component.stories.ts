import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { EMPTY, of, Subject } from 'rxjs';
import { SideBarComponent } from './side-bar.component';
import { CoreModule } from '@app/core/core.module';
import { PermissionsService } from '@app/core/services/permissions.service';
import { AccountService } from '@app/core/services/account.service';
import { VersionService } from '@app/core/services/version.service';
import { Permissions } from '@app/core/services/permissions';
import { Account, MembershipState } from '@app/shared/models/account';
import { AppComponent } from '@app/app.component';
import { Router } from '@angular/router';

// Mock the static AppComponent.utilityHubConnection used in SideBarComponent.ngOnInit
(AppComponent as any).utilityHubConnection = {
    connection: { on: () => {}, off: () => {} },
    reconnectEvent: new Subject<void>(),
    dispose: () => {}
};

const mockAccount: Account = {
    id: '1',
    displayName: 'Sgt.Miller.B',
    membershipState: MembershipState.MEMBER,
    email: 'test@test.com',
    firstname: 'Bob',
    lastname: 'Miller',
} as Account;

const mockRouter = {
    url: '/home',
    events: EMPTY,
    navigate: () => Promise.resolve(true),
    navigateByUrl: () => Promise.resolve(true),
    createUrlTree: () => ({}),
    serializeUrl: () => ''
};

function buildPermissionsMap(...perms: string[]): Record<string, boolean> {
    const map: Record<string, boolean> = {};
    perms.forEach(p => map[p] = true);
    return map;
}

function sidebarProviders(permissions: Record<string, boolean>, account: Account | null, routerUrl = '/home') {
    return [
        { provide: Router, useValue: { ...mockRouter, url: routerUrl } },
        { provide: PermissionsService, useValue: { getPermissions: () => permissions } },
        { provide: AccountService, useValue: { account, accountChange$: new Subject<Account>() } },
        { provide: VersionService, useValue: { getVersion: () => of(1) } }
    ];
}

const meta: Meta<SideBarComponent> = {
    title: 'Layout/SideBar',
    component: SideBarComponent,
    decorators: [
        moduleMetadata({
            imports: [CoreModule],
            providers: sidebarProviders(buildPermissionsMap(Permissions.UNLOGGED), null)
        })
    ]
};
export default meta;
type Story = StoryObj<SideBarComponent>;

export const NotLoggedIn: Story = {
    decorators: [
        moduleMetadata({
            providers: sidebarProviders(buildPermissionsMap(Permissions.UNLOGGED), null)
        })
    ]
};

export const Member: Story = {
    decorators: [
        moduleMetadata({
            providers: sidebarProviders(
                buildPermissionsMap(Permissions.MEMBER, Permissions.RECRUITER, Permissions.COMMAND),
                mockAccount,
                '/command'
            )
        })
    ]
};

export const Admin: Story = {
    decorators: [
        moduleMetadata({
            providers: sidebarProviders(
                buildPermissionsMap(Permissions.MEMBER, Permissions.RECRUITER, Permissions.COMMAND, Permissions.ADMIN),
                mockAccount,
                '/admin'
            )
        })
    ]
};
