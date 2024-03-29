import { Account } from './Account';
import { IDropdownElement } from '../Components/elements/dropdown-base/dropdown-base.component';

export class Unit {
    id: string;
    branch: UnitBranch;
    callsign: string;
    discordRoleId: string;
    icon: string;
    preferShortname: boolean;
    name: string;
    parent: string;
    shortname: string;
    teamspeakGroup: string;
    order: number;
    members: string[];
    roles: { [id: string]: string };

    parentUnit: Unit;
    children: Unit[];
    memberObjects: Account[];
    memberRole: string;

    public constructor(element: IDropdownElement) {
        this.id = element.value;
        this.name = element.displayValue;
    }

    public static mapToElement(unit: Unit): IDropdownElement {
        return {
            value: unit.id,
            displayValue: unit.name
        };
    }
}

export enum UnitBranch {
    COMBAT,
    AUXILIARY
}

export interface ResponseUnit extends Unit {
    code: string;
    parentName: string;
    unitMembers: ResponseUnitMember[];
}

export interface ResponseUnitMember {
    name: string;
    role: string;
    unitRole: string;
}

export interface UnitTreeDataSet {
    auxiliaryNodes: Unit[];
    combatNodes: Unit[];
}

export interface ResponseUnitChartNode {
    id: string;
    name: string;
    children: ResponseUnitChartNode[];
    members: ResponseUnitMember[];
}

export interface RequestUnitUpdateParent {
    index: number;
    parentId: string;
}

export interface RequestUnitUpdateOrder {
    index: number;
}
