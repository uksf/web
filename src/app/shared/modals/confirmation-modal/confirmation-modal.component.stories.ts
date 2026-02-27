import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ConfirmationModalComponent, ConfirmationModalData } from './confirmation-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../.storybook/utils/mock-providers';

const meta: Meta<ConfirmationModalComponent> = {
    title: 'Modals/Confirmation',
    component: ConfirmationModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: modalProviders({ message: 'Are you sure you want to proceed?' } as ConfirmationModalData)
        })
    ]
};
export default meta;
type Story = StoryObj<ConfirmationModalComponent>;

export const Default: Story = {};

export const CustomTitle: Story = {
    decorators: [
        moduleMetadata({
            providers: modalProviders({
                message: 'This action cannot be undone. All data associated with this account will be permanently deleted.',
                title: 'Delete Account',
                button: 'Delete'
            } as ConfirmationModalData)
        })
    ]
};

export const HtmlContent: Story = {
    decorators: [
        moduleMetadata({
            providers: modalProviders({
                message: 'Are you sure you want to <strong>remove</strong> this member from the unit?',
                title: 'Confirm Action'
            } as ConfirmationModalData)
        })
    ]
};
