export interface NpcVoice {
    id: string;
    voiceId: string;
    displayName: string;
    ownerId: string;
    moodOf: string | null;
    durationMs: number;
    createdAt: string;
}

// Numeric to match the API enum wire format (no JsonStringEnumConverter is registered, so
// NpcMoodStatus serializes as its integer ordinal — same convention as MembershipState etc.).
export enum NpcMoodStatus {
    Pending = 0,
    Ready = 1,
    Failed = 2
}

export interface NpcMoodTask {
    mood: string;
    status: NpcMoodStatus;
    error: string | null;
}

export interface NpcVoiceJob {
    id: string;
    baseVoiceId: string;
    ownerId: string;
    moods: NpcMoodTask[];
    createdAt: string;
}

// The moods an NPC can speak in, in display order. Every one is generated from the uploaded
// source sample, neutral included, so the character keeps one voice across moods.
export const NPC_MOODS = ['neutral', 'angry', 'afraid', 'sad', 'happy'] as const;
export type NpcMood = (typeof NPC_MOODS)[number];
