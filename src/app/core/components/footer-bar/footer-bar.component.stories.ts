import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FooterBarComponent } from './footer-bar.component';
import { CoreModule } from '@app/core/core.module';

const meta: Meta<FooterBarComponent> = {
    title: 'Layout/FooterBar',
    component: FooterBarComponent,
    decorators: [
        moduleMetadata({
            imports: [CoreModule]
        })
    ]
};
export default meta;
type Story = StoryObj<FooterBarComponent>;

export const Default: Story = {};
