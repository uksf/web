import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { of, Subject } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { SideBarComponent } from './side-bar.component';
import { PermissionsService } from '@app/core/services/permissions.service';
import { AccountService } from '@app/core/services/account.service';
import { VersionService } from '@app/core/services/version.service';
import { UtilityHubService } from '@app/core/services/utility-hub.service';
import { Permissions } from '@app/core/services/permissions';
import { Account, MembershipState } from '@app/shared/models/account';

const mockAccount: Account = {
    id: '1',
    displayName: 'Sgt.Miller.B',
    membershipState: MembershipState.MEMBER,
    email: 'test@test.com',
    firstname: 'Bob',
    lastname: 'Miller',
} as Account;

function buildPermissionsMap(...perms: string[]): Record<string, boolean> {
    const map: Record<string, boolean> = {};
    perms.forEach(p => map[p] = true);
    return map;
}

function sidebarProviders(permissions: Record<string, boolean>, account: Account | null) {
    return [
        { provide: PermissionsService, useValue: { getPermissions: () => permissions } },
        { provide: AccountService, useValue: { account, accountChange$: new Subject<Account>() } },
        { provide: VersionService, useValue: { getVersion: () => of(1) } },
        {
            provide: UtilityHubService, useValue: {
                on: () => {},
                off: () => {},
                reconnected$: new Subject<void>()
            }
        }
    ];
}

const meta: Meta<SideBarComponent> = {
    title: 'Layout/SideBar',
    component: SideBarComponent,
    decorators: [
        moduleMetadata({
            imports: [RouterTestingModule],
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
                mockAccount
            )
        })
    ]
};

export const Admin: Story = {
    decorators: [
        moduleMetadata({
            providers: sidebarProviders(
                buildPermissionsMap(Permissions.MEMBER, Permissions.RECRUITER, Permissions.COMMAND, Permissions.ADMIN),
                mockAccount
            )
        })
    ]
};
