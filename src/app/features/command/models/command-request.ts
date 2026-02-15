export interface CommandRequestReview {
    id: string;
    name: string;
    state: number;
}

export interface CommandRequest {
    id?: string;
    value?: string;
    displayValue?: string;
    dateCreated?: Date;
    displayFrom?: string;
    displayRecipient?: string;
    displayRequester?: string;
    reason?: string;
    recipient?: string;
    requester?: string;
    reviews?: CommandRequestReview[];
    secondaryValue?: string;
    type?: string;
}

export interface CommandRequestItem {
    canOverride: boolean;
    data: CommandRequest;
    displayReason: string;
    displayType: string;
    reviews: CommandRequestReview[];
    // Frontend-only properties
    updating?: boolean;
    reviewState?: number;
    reviewOverriden?: boolean;
}

export interface CommandRequestsResponse {
    myRequests: CommandRequestItem[];
    otherRequests: CommandRequestItem[];
}
