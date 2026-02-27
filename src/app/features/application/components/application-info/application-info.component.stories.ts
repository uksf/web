import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ApplicationInfoComponent } from './application-info.component';
import { SharedModule } from '@shared/shared.module';

const meta: Meta<ApplicationInfoComponent> = {
    title: 'Application/Info',
    component: ApplicationInfoComponent,
    decorators: [
        moduleMetadata({
            imports: [SharedModule]
        })
    ]
};
export default meta;
type Story = StoryObj<ApplicationInfoComponent>;

export const Default: Story = {};
