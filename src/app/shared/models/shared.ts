import { UnitBranch } from '@app/features/units/models/units';

export interface RequestModalData {
    ids: string[];
    allowedBranches?: UnitBranch[];
}
