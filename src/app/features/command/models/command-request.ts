export enum ReviewState {
    APPROVED = 0,
    REJECTED = 1,
    PENDING = 2,
    ERROR = 3
}

export interface CommandRequestReview {
    id: string;
    name: string;
    state: ReviewState;
}

export interface CommandRequest {
    id: string;
    type: string;
    value: string;
    secondaryValue: string;
    displayValue: string;
    displayFrom: string;
    displayRequester: string;
    displayRecipient: string;
    reason: string;
    requester: string;
    recipient: string;
    dateCreated: string;
    reviews: Record<string, ReviewState>;
}

export interface CommandReviewEvent {
    state: ReviewState;
    overridden: boolean;
}

export interface CommandRequestItem {
    data: CommandRequest;
    displayReason: string;
    displayType: string;
    iconKey: string;
    colorKey: string;
    canOverride: boolean;
    reviews: CommandRequestReview[];

    // frontend-only state (set during patch in-flight)
    updating?: boolean;
    reviewState?: ReviewState;
    reviewOverridden?: boolean;
}

export interface CommandRequestsResponse {
    myRequests: CommandRequestItem[];
    otherRequests: CommandRequestItem[];
}
