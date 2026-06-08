export interface NpcVoice {
    id: string;
    voiceId: string;
    displayName: string;
    ownerId: string;
    moodOf: string | null;
    durationMs: number;
    createdAt: string;
}
