export interface Unit {
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
}

export enum UnitBranch {
    COMBAT,
    AUXILIARY,
}

export interface ResponseUnit extends Unit {
    code: string;
    parentId: string;
    parentName: string;
    unitMembers: ResponseUnitMember[];
}

export interface ResponseUnitMember {
    name: string;
    role: string;
    unitRole: string;
}

export interface ResponseUnitTree {
    id: string;
    name: string;
    children: ResponseUnitTree[];
}

export interface ResponseUnitTreeDataSet {
    auxiliaryNodes: ResponseUnitTree[];
    combatNodes: ResponseUnitTree[];
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
