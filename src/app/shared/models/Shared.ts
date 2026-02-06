import { UnitBranch } from '@app/features/units/models/Units';

export interface RequestModalData {
    ids: string[];
    allowedBranches?: UnitBranch[];
}
