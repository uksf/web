export interface CommandRequestReview {
    id: string;
    name: string;
    state: number;
}

export interface CommandRequest {
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
