import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ApplicationEmailConfirmationComponent } from './application-email-confirmation.component';
import { SharedModule } from '@shared/shared.module';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '@app/core/services/account.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { ApplicationService } from '../../services/application.service';
import { of } from 'rxjs';

const meta: Meta<ApplicationEmailConfirmationComponent> = {
    title: 'Application/EmailConfirmation',
    component: ApplicationEmailConfirmationComponent,
    decorators: [
        moduleMetadata({
            imports: [SharedModule],
            providers: [
                { provide: ApplicationService, useValue: { validateEmailCode: () => of({}), resendEmailCode: () => of({}) } },
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: AccountService, useValue: { account: { email: 'applicant@example.com' } } },
                { provide: PermissionsService, useValue: { refresh: () => Promise.resolve() } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<ApplicationEmailConfirmationComponent>;

export const Default: Story = {};
