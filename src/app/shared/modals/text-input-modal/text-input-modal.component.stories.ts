import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { TextInputModalComponent, TextInputModalData } from './text-input-modal.component';
import { SharedModule } from '@shared/shared.module';
import { MatInputModule } from '@angular/material/input';
import { modalProviders, modalImports } from '../../../../../.storybook/utils/mock-providers';

const meta: Meta<TextInputModalComponent> = {
    title: 'Modals/TextInput',
    component: TextInputModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule, MatInputModule],
            providers: modalProviders({ message: 'Please provide a reason for this action.' } as TextInputModalData)
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
                message: 'Please explain why this application is being rejected.',
                title: 'Rejection Reason'
            } as TextInputModalData)
        })
    ]
};
