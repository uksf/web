import { IDropdownElement } from '../Components/elements/dropdown-base/dropdown-base.component';

export enum RoleType {
    INDIVIDUAL,
    UNIT
}

export class Role {
    name: string;
    order: number;
    roleType: RoleType;

    public constructor(element: IDropdownElement) {
        this.name = element.value;
    }

    public static mapToElement(role: Role): IDropdownElement {
        return {
            value: role.name,
            displayValue: role.name
        };
    }
}

export interface RolesDataset {
    roles: Role[];
}
