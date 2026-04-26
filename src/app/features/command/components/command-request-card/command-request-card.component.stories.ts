import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommandRequestCardComponent } from './command-request-card.component';
import { SharedModule } from '@shared/shared.module';
import { AccountService } from '@app/core/services/account.service';
import { CommandRequestItem, ReviewState } from '@app/features/command/models/command-request';

const baseItem: CommandRequestItem = {
    data: {
        id: 'r1',
        type: 'Loa',
        value: '',
        secondaryValue: '',
        displayValue: '2026-05-22',
        displayFrom: '2026-05-15',
        displayRequester: 'SSgt Tim',
        displayRecipient: 'Cpl Bridg',
        reason: 'Family holiday — already cleared with chain of command.',
        requester: 'tim',
        recipient: 'bridg',
        dateCreated: '2026-04-23T10:00:00Z',
        reviews: {}
    },
    displayReason: 'Family holiday — already cleared with chain of command.',
    displayType: 'Loa',
    iconKey: 'event_busy',
    colorKey: 'loa',
    canOverride: false,
    reviews: [
        { id: 'me', name: 'Tim', state: ReviewState.PENDING },
        { id: 'stoff', name: 'Stoff', state: ReviewState.APPROVED }
    ]
};

const make = (overrides: Partial<CommandRequestItem> = {}): StoryObj<CommandRequestCardComponent> => ({
    args: { request: { ...baseItem, ...overrides } as CommandRequestItem }
});

const meta: Meta<CommandRequestCardComponent> = {
    title: 'Command/CommandRequestCard',
    component: CommandRequestCardComponent,
    decorators: [
        moduleMetadata({
            imports: [SharedModule],
            providers: [{ provide: AccountService, useValue: { account: { id: 'me' } } }]
        })
    ]
};
export default meta;

type Story = StoryObj<CommandRequestCardComponent>;

export const LoaPendingMyReview: Story = make();

export const Promotion: Story = make({
    data: { ...baseItem.data, type: 'Promotion', displayFrom: 'Pvt', displayValue: 'LCpl' },
    displayType: 'Promotion',
    iconKey: 'stars',
    colorKey: 'promotion'
});

export const Demotion: Story = make({
    data: { ...baseItem.data, type: 'Demotion', displayFrom: 'Cpl', displayValue: 'LCpl' },
    displayType: 'Demotion',
    iconKey: 'mood_bad',
    colorKey: 'demotion'
});

export const Transfer: Story = make({
    data: { ...baseItem.data, type: 'Transfer', displayFrom: 'SFSG', displayValue: 'JSFAW' },
    displayType: 'Transfer',
    iconKey: 'swap_horiz',
    colorKey: 'transfer'
});

export const AuxiliaryTransfer: Story = make({
    data: { ...baseItem.data, type: 'Auxiliary Transfer', displayFrom: 'Drone Operators', displayValue: 'Recce' },
    displayType: 'Auxiliary Transfer',
    iconKey: 'swap_horiz',
    colorKey: 'aux-transfer'
});

export const SecondaryTransfer: Story = make({
    data: { ...baseItem.data, type: 'Secondary Transfer', displayFrom: 'Doc Team', displayValue: 'Comms Cell' },
    displayType: 'Secondary Transfer',
    iconKey: 'swap_horiz',
    colorKey: 'sec-transfer'
});

export const Role: Story = make({
    data: { ...baseItem.data, type: 'Role', displayFrom: 'No role', displayValue: 'Section Medic' },
    displayType: 'Role',
    iconKey: 'assignment_ind',
    colorKey: 'role'
});

export const ChainOfCommandPosition: Story = make({
    data: { ...baseItem.data, type: 'Chain of Command Position', displayFrom: '2 Section', displayValue: '1iC' },
    displayType: 'Chain Of Command Position',
    iconKey: 'military_tech',
    colorKey: 'cocp'
});

export const UnitRemoval: Story = make({
    data: { ...baseItem.data, type: 'Unit Removal', displayFrom: 'Drone Operators', displayValue: 'removed' },
    displayType: 'Unit Removal',
    iconKey: 'group_off',
    colorKey: 'unit-removal'
});

export const Discharge: Story = make({
    data: { ...baseItem.data, type: 'Discharge', displayFrom: 'Active member', displayValue: 'Discharged' },
    displayType: 'Discharge',
    iconKey: 'person_off',
    colorKey: 'discharge'
});

export const Reinstate: Story = make({
    data: { ...baseItem.data, type: 'Reinstate Member', displayFrom: 'Discharged', displayValue: 'BTU Recruit' },
    displayType: 'Reinstate Member',
    iconKey: 'person_add',
    colorKey: 'reinstate'
});

export const WithOverrideRights: Story = make({ canOverride: true });

export const PassiveViewer: Story = {
    args: {
        request: {
            ...baseItem,
            reviews: [{ id: 'other', name: 'Stoff', state: ReviewState.PENDING }]
        } as CommandRequestItem
    }
};
