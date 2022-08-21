export interface NewIssueRequest {
    issueType: NewIssueType;
    title: string;
    body: string;
}

export interface NewIssueResponse {
    issueUrl: string;
}

export enum NewIssueType {
    WEBSITE,
    MODPACK
}
