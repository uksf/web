export interface NpcVoice {
    id: string;
    voiceId: string;
    displayName: string;
    ownerId: string;
    moodOf: string | null;
    durationMs: number;
    createdAt: string;
}

export type NpcMoodStatus = 'Pending' | 'Ready' | 'Failed';

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
