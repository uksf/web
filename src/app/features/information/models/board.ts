export interface BoardListItem {
    id: string;
    name: string;
    color: string;
    memberCount: number;
}

export interface Board {
    id: string;
    name: string;
    color: string;
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
    color: string;
    permissions: BoardPermissions;
}

export interface UpdateBoardRequest {
    name: string;
    color: string;
    permissions: BoardPermissions;
    labels: string[];
}

export const BOARD_COLOR_PALETTE: string[] = [
    '#f44336', // red
    '#ff9800', // orange
    '#ffc107', // amber
    '#4caf50', // green
    '#2196f3', // blue
    '#7b1fa2', // purple
    '#009688', // teal
    '#616161'  // grey
];

export const BOARD_COLUMN_COLORS: Record<BoardColumnKey, string> = {
    [BoardColumnKey.Todo]: '#9e9e9e',
    [BoardColumnKey.Blocked]: '#f44336',
    [BoardColumnKey.InProgress]: '#2196f3',
    [BoardColumnKey.Review]: '#ffc107',
    [BoardColumnKey.Done]: '#4caf50'
};

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
