import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { AddServerModalComponent } from './add-server-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { MatDialog } from '@angular/material/dialog';
import { GameServersService } from '../../services/game-servers.service';
import { of } from 'rxjs';

const meta: Meta<AddServerModalComponent> = {
    title: 'Modals/AddServer',
    component: AddServerModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                ...modalProviders(null),
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: GameServersService, useValue: { addServer: () => of({}), editServer: () => of(false), checkServerExists: () => of(false) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<AddServerModalComponent>;

export const Default: Story = {};
