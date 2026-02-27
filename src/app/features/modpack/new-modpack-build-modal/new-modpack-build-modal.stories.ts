import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { NewModpackBuildModalComponent } from './new-modpack-build-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../.storybook/utils/mock-providers';

const meta: Meta<NewModpackBuildModalComponent> = {
    title: 'Modals/NewModpackBuild',
    component: NewModpackBuildModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: modalProviders({ branches: ['No branch', 'main', 'develop', 'feature/new-weapons'] })
        })
    ]
};
export default meta;
type Story = StoryObj<NewModpackBuildModalComponent>;

export const Default: Story = {};
