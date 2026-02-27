import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ChangeFirstLastModalComponent } from './change-first-last-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { ProfileService } from '../../services/profile.service';
import { RanksService } from '@app/features/command/services/ranks.service';
import { AccountService } from '@app/core/services/account.service';
import { of } from 'rxjs';

const meta: Meta<ChangeFirstLastModalComponent> = {
    title: 'Modals/ChangeFirstLast',
    component: ChangeFirstLastModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: [
                { provide: ProfileService, useValue: { changeName: () => of({}) } },
                { provide: RanksService, useValue: { getRanks: () => of([{ name: 'Private', abbreviation: 'Pte' }]) } },
                { provide: AccountService, useValue: { account: { firstname: 'John', lastname: 'Smith', rank: 'Private' }, getAccount: () => of({}) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<ChangeFirstLastModalComponent>;

export const Default: Story = {};
