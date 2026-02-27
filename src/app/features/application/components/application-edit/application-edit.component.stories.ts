import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ApplicationEditComponent } from './application-edit.component';
import { SharedModule } from '@shared/shared.module';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '@app/core/services/account.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Router } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { of, Subject } from 'rxjs';
import { ApplicationState } from '@app/features/application/models/application';

const mockAccount = {
    id: 'test-id',
    firstname: 'Barry',
    lastname: 'Miller',
    armaExperience: 'Over 2000 hours in Arma 3.',
    unitsExperience: 'Previously in 3 Commando Brigade.',
    background: 'I am 25 years old from London.',
    militaryExperience: false,
    reference: 'Steam',
    rolePreferences: ['Aviation'],
    application: {
        state: ApplicationState.WAITING,
        applicationCommentThread: 'test-thread'
    }
};

const meta: Meta<ApplicationEditComponent> = {
    title: 'Application/Edit',
    component: ApplicationEditComponent,
    decorators: [
        moduleMetadata({
            imports: [SharedModule],
            providers: [
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }), closeAll: () => {} } },
                { provide: AccountService, useValue: { account: { ...mockAccount }, getAccount: () => of({}) } },
                { provide: PermissionsService, useValue: { hasPermission: () => false, accountUpdateEvent: new Subject() } },
                { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
                { provide: ApplicationService, useValue: { updateApplication: () => of({}) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<ApplicationEditComponent>;

export const Waiting: Story = {};
