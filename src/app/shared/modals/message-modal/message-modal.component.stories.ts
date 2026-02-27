import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MessageModalComponent, MessageModalData } from './message-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../.storybook/utils/mock-providers';

const meta: Meta<MessageModalComponent> = {
    title: 'Modals/Message',
    component: MessageModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: modalProviders({ message: 'Your application has been submitted successfully.', title: 'Message' } as MessageModalData)
        })
    ]
};
export default meta;
type Story = StoryObj<MessageModalComponent>;

export const Default: Story = {};

export const CustomTitle: Story = {
    decorators: [
        moduleMetadata({
            providers: modalProviders({
                message: 'The game server is currently undergoing maintenance. Expected downtime: 30 minutes.',
                title: 'Server Status',
                button: 'Understood'
            } as MessageModalData)
        })
    ]
};

export const LongMessage: Story = {
    decorators: [
        moduleMetadata({
            providers: modalProviders({
                message: `Version 2.5.0 includes the following changes:

- Updated modpack configuration
- Fixed server connection timeout issues
- Improved mission file handling
- Added new training scenarios
- Updated TeamSpeak integration
- Fixed Discord webhook notifications
- Performance improvements for large unit rosters`,
                title: 'Release Notes'
            } as MessageModalData)
        })
    ]
};
