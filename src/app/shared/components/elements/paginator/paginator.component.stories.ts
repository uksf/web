import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { PaginatorComponent } from './paginator.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const meta: Meta<PaginatorComponent> = {
    title: 'Shared/Paginator',
    component: PaginatorComponent,
    decorators: [
        moduleMetadata({
            imports: [MatIconModule, MatSelectModule, MatButtonModule, MatTooltipModule, FormsModule, BrowserAnimationsModule]
        })
    ]
};
export default meta;

type Story = StoryObj<PaginatorComponent>;

export const Default: Story = {
    args: {
        total: 100
    }
};

export const SmallDataset: Story = {
    args: {
        total: 5
    }
};

export const ExactlyOnePage: Story = {
    args: {
        total: 15
    }
};

export const LargeDataset: Story = {
    args: {
        total: 500
    }
};
