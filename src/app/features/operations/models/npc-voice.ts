export interface NpcVoice {
    id: string;
    voiceId: string;
    displayName: string;
    ownerId: string;
    moodOf: string | null;
    durationMs: number;
    createdAt: string;
}

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

export const NPC_MOODS = ['neutral', 'angry', 'afraid', 'sad', 'happy'] as const;
export type NpcMood = (typeof NPC_MOODS)[number];
