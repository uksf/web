import { UnitBranch } from './Units';

export interface RequestModalData {
    ids: string[];
    allowedBranches?: UnitBranch[];
}
