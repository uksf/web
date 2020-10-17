export enum MembershipState {
    UNCONFIRMED,
    CONFIRMED,
    MEMBER,
    DISCHARGED,
}

export enum ApplicationState {
    ACCEPTED,
    REJECTED,
    WAITING,
}

export interface Account {
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

    displayName: string;
    permissions: AccountPermissions;
}

export interface AccountPermissions {
    admin: boolean;
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

export interface ServiceRecordEntry {
    notes: string;
    occurence: string;
    timestamp: Date;
}

export interface Application {
    applicationCommentThread: string;
    dateAccepted: Date;
    dateCreated: Date;
    ratings: { [id: string]: number };
    recruiter: string;
    recruiterCommentThread: string;
    state: ApplicationState;
}

export interface RosterAccount {
    id: string;
    name: string;
    nation: string;
    rank: string;
    roleAssignment: string;
    unitAssignment: string;
}
