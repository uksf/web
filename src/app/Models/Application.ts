import { Account } from './Account';

export enum ApplicationState {
    ACCEPTED,
    REJECTED,
    WAITING,
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

export interface WaitingApplication {
    account: Account;
    steamProfile: string;
    daysProcessing: number;
    processingDifference: number;
    recruiter: string;
}

export interface CompletedApplication {
    account: Account;
    displayName: string;
    daysProcessed: number;
    recruiter: string;
}

export interface ApplicationsOverview {
    waiting: WaitingApplication[];
    allWaiting: WaitingApplication[];
    complete: CompletedApplication[];
    recruiters: string[];
}

export interface Recruiter {
    id: string;
    name: string;
}
