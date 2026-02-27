import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { TextInputModalComponent, TextInputModalData } from './text-input-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../.storybook/utils/mock-providers';

const meta: Meta<TextInputModalComponent> = {
    title: 'Modals/TextInput',
    component: TextInputModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: modalProviders({ title: 'Input' } as TextInputModalData)
        })
    ]
};
export default meta;
type Story = StoryObj<TextInputModalComponent>;

export const Default: Story = {};

export const Filled: Story = {
    decorators: [
        moduleMetadata({
            providers: modalProviders({
                title: 'Rejection Reason'
            } as TextInputModalData)
        })
    ]
};
