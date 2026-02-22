import { Account } from '@app/shared/models/account';

export enum ApplicationState {
    ACCEPTED,
    REJECTED,
    WAITING
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

export interface DetailedApplication {
    account: Account;
    displayName: string;
    age: ApplicationAge;
    acceptableAge: number;
    daysProcessing: number;
    daysProcessed: number;
    nextCandidateOp: string;
    averageProcessingTime: number;
    steamProfile: string;
    recruiter: string;
    recruiterId: string;
}

export interface ApplicationAge {
    years: number;
    months: number;
}

export interface ActiveApplication {
    account: Account;
    steamProfile: string;
    daysProcessing: number;
    processingDifference: number;
    recruiter: string;

    // Computed property for template binding
    _colour?: string;
}

export interface CompletedApplication {
    account: Account;
    displayName: string;
    daysProcessed: number;
    recruiter: string;
}

export interface Recruiter {
    id: string;
    name: string;
    active: boolean;
}
