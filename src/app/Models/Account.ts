import { Application } from './Application';
import { IDropdownElement } from '../Components/elements/dropdown-base/dropdown-base.component';
import { Rank } from './Rank';
import { Role } from './Role';
import { Unit } from './Units';
import { Training } from './Training';

export enum MembershipState {
    UNCONFIRMED,
    CONFIRMED,
    MEMBER,
    DISCHARGED
}

export interface CreateAccount {
    dobDay: number;
    dobMonth: number;
    dobYear: number;
    email: string;
    firstName: string;
    lastName: string;
    nation: string;
    password: string;
}

export class Account {
    id: string;
    application: Application;
    armaExperience: string;
    background: string;
    discordId: string;
    dob: Date;
    email: string;
    firstname: string;
    lastname: string;
    membershipState: MembershipState;
    militaryExperience: boolean;
    nation: string;
    rank: string;
    reference: string;
    roleAssignment: string;
    rolePreferences: string[];
    serviceRecord: ServiceRecordEntry[];
    settings: AccountSettings;
    steamname: string;
    teamspeakIdentities: number[];
    unitAssignment: string;
    unitsExperience: string;
    qualifications: AccountQualifications;
    trainings: Training[];

    displayName: string;
    permissions: AccountPermissions;

    rankObject: Rank;
    roleObject: Role;
    unitObject: Unit;
    unitObjects: Unit[];
}

export interface AccountPermissions {
    Admin: boolean;
    command: boolean;
    nco: boolean;
    personnel: boolean;
    recruiter: boolean;
    recruiterLead: boolean;
    servers: boolean;
    tester: boolean;
}

export interface AccountSettings {
    notificationsEmail: boolean;
    notificationsTeamspeak: boolean;
    sr1Enabled: boolean;
}

export interface AccountQualifications {
    medic: boolean;
    engineer: boolean;
}

export interface ServiceRecordEntry {
    notes: string;
    occurence: string;
    timestamp: Date;
}

export interface RosterAccount {
    id: string;
    name: string;
    nation: string;
    rank: string;
    roleAssignment: string;
    unitAssignment: string;
}

export class BasicAccount {
    id: string;
    displayName: string;

    public constructor(element: IDropdownElement) {
        this.id = element.value;
        this.displayName = element.displayValue;
    }

    public static mapToElement(account: BasicAccount): IDropdownElement {
        return {
            value: account.id,
            displayValue: account.displayName
        };
    }
}
