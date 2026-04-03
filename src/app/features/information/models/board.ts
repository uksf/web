export interface BoardListItem {
    id: string;
    name: string;
    memberCount: number;
}

export interface Board {
    id: string;
    name: string;
    labels: string[];
    permissions: BoardPermissions;
    members: BoardMember[];
    columns: BoardColumn[];
}

export interface BoardPermissions {
    units: string[];
    members: string[];
    expandToSubUnits: boolean;
}

export interface BoardMember {
    id: string;
    displayName: string;
}

export interface BoardColumn {
    key: BoardColumnKey;
    name: string;
    cards: BoardCard[];
    totalCards: number;
}

export enum BoardColumnKey {
    Todo = 0,
    Blocked = 1,
    InProgress = 2,
    Review = 3,
    Done = 4
}

export interface BoardCard {
    id: string;
    title: string;
    detail: string;
    labels: string[];
    assigneeId: string;
    assigneeName: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
    closedAt: string;
    order: number;
    commentThreadId: string;
    activity: BoardCardActivity[];
}

export interface BoardCardActivity {
    userName: string;
    timestamp: string;
    description: string;
}

export interface CreateBoardRequest {
    name: string;
    permissions: BoardPermissions;
}

export interface UpdateBoardRequest {
    name: string;
    permissions: BoardPermissions;
    labels: string[];
}

export interface CreateCardRequest {
    title: string;
}

export interface UpdateCardRequest {
    title: string;
    detail: string;
    labels: string[];
    assigneeId: string;
}

export interface MoveCardRequest {
    targetColumn: BoardColumnKey;
    targetIndex: number;
}
