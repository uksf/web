import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { AddUnitModalComponent } from './add-unit-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../../.storybook/utils/mock-providers';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UnitsService } from '../../services/units.service';
import { of } from 'rxjs';
import { ResponseUnit, UnitBranch } from '@app/features/units/models/units';

const mockUnits: ResponseUnit[] = [
    { id: '1', name: 'UKSF', shortname: 'UKSF', branch: UnitBranch.COMBAT, parent: '000000000000000000000000' } as ResponseUnit,
    { id: '2', name: '1 Squadron', shortname: '1 Sqn', branch: UnitBranch.COMBAT, parent: '1' } as ResponseUnit,
    { id: '3', name: '2 Squadron', shortname: '2 Sqn', branch: UnitBranch.COMBAT, parent: '1' } as ResponseUnit
];

const meta: Meta<AddUnitModalComponent> = {
    title: 'Modals/AddUnit',
    component: AddUnitModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule, MatCheckboxModule],
            providers: [
                ...modalProviders(null),
                { provide: MatDialog, useValue: { closeAll: () => {}, open: () => ({ afterClosed: () => of(undefined) }) } },
                { provide: UnitsService, useValue: { getAllUnits: () => of(mockUnits), checkUnitExists: () => of(false), createUnit: () => of({}), updateUnit: () => of({}) } }
            ]
        })
    ]
};
export default meta;
type Story = StoryObj<AddUnitModalComponent>;

export const Default: Story = {};

export const EditMode: Story = {
    decorators: [
        moduleMetadata({
            providers: [
                ...modalProviders({
                    unit: {
                        id: '2',
                        name: '1 Squadron',
                        shortname: '1 Sqn',
                        branch: UnitBranch.COMBAT,
                        parent: '1',
                        teamspeakGroup: '210',
                        discordRoleId: '987654321098765432',
                        callsign: 'Alpha',
                        icon: 'sqn-icon.paa',
                        preferShortname: false
                    } as ResponseUnit
                })
            ]
        })
    ]
};
