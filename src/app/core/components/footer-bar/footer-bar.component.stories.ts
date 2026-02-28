import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FooterBarComponent } from './footer-bar.component';

const meta: Meta<FooterBarComponent> = {
    title: 'Layout/FooterBar',
    component: FooterBarComponent
};
export default meta;
type Story = StoryObj<FooterBarComponent>;

export const Default: Story = {};
