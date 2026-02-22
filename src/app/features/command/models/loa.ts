export interface Loa {
    id: string;
    submitted: Date;
    start: Date;
    end: Date;
    state: LoaReviewState;
    reason: string;
    emergency: boolean;
    late: boolean;
    name: string;
    inChainOfCommand: boolean;
    longTerm: boolean;

    // Computed properties for template binding
    _canViewReason?: boolean;
    _canDelete?: boolean;
}

export enum LoaReviewState {
    PENDING,
    APPROVED,
    REJECTED
}
