import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { InstallWorkshopModModalComponent } from './install-workshop-mod-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../.storybook/utils/mock-providers';

const meta: Meta<InstallWorkshopModModalComponent> = {
    title: 'Modals/InstallWorkshopMod',
    component: InstallWorkshopModModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: modalProviders()
        })
    ]
};
export default meta;
type Story = StoryObj<InstallWorkshopModModalComponent>;

export const Default: Story = {};
