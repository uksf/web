import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ApplicationIdentityComponent } from './application-identity.component';
import { SharedModule } from '@shared/shared.module';
import { MatDialog } from '@angular/material/dialog';
import { ApplicationService } from '../../services/application.service';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { of } from 'rxjs';

const meta: Meta<ApplicationIdentityComponent> = {
    title: 'Application/Identity',
    component: ApplicationIdentityComponent,
    decorators: [
        moduleMetadata({
            imports: [SharedModule],
            providers: [
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: ApplicationService, useValue: { getNations: () => of(['GB', 'US', 'DE']), checkEmailExists: () => of(false) } },
                { provide: AuthenticationService, useValue: { createAccount: () => of({}) } },
                { provide: PermissionsService, useValue: { refresh: () => Promise.resolve() } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<ApplicationIdentityComponent>;

export const Empty: Story = {};
