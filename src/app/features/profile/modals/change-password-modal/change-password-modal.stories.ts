import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ChangePasswordModalComponent } from './change-password-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { ProfileService } from '../../services/profile.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

const meta: Meta<ChangePasswordModalComponent> = {
    title: 'Modals/ChangePassword',
    component: ChangePasswordModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                { provide: ProfileService, useValue: { changePassword: () => of({}) } },
                { provide: PermissionsService, useValue: { revoke: () => {} } },
                { provide: MatDialog, useValue: { closeAll: () => {} } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<ChangePasswordModalComponent>;

export const Default: Story = {};
