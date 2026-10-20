import { NPC_MOODS, NpcMood, NpcMoodStatus, NpcVoice, NpcVoiceJob } from '../models/npc-voice';

export type NpcMoodState = 'ready' | 'generating' | 'failed' | 'missing';

export interface NpcMoodView {
    mood: NpcMood;
    variant: NpcVoice | null;
    state: NpcMoodState;
    error: string | null;
}

export interface NpcVoiceGroup {
    voiceId: string;
    base: NpcVoice | null;
    moods: NpcMoodView[];
}

export function groupVoices(voices: NpcVoice[], jobs: Record<string, NpcVoiceJob>): NpcVoiceGroup[] {
    const ids = new Set(voices.map((v) => v.moodOf ?? v.voiceId));
    return [...ids]
        .map((voiceId) => {
            const variants = voices.filter((v) => v.moodOf === voiceId);
            return {
                voiceId,
                base: voices.find((v) => v.voiceId === voiceId && !v.moodOf) ?? null,
                moods: NPC_MOODS.map((mood) => moodView(mood, variants.find((v) => v.voiceId === `${voiceId}_${mood}`) ?? null, jobs[voiceId]))
            };
        })
        .sort((a, b) => groupName(a).localeCompare(groupName(b)));
}

function moodView(mood: NpcMood, variant: NpcVoice | null, job: NpcVoiceJob | undefined): NpcMoodView {
    const task = job?.moods.find((m) => m.mood === mood);
    if (task?.status === NpcMoodStatus.Pending) {
        return { mood, variant, state: 'generating', error: null };
    }
    if (variant) {
        return { mood, variant, state: 'ready', error: null };
    }
    if (task?.status === NpcMoodStatus.Failed) {
        return { mood, variant, state: 'failed', error: task.error };
    }
    return { mood, variant, state: 'missing', error: null };
}

export function groupName(group: NpcVoiceGroup): string {
    return group.base?.displayName || group.voiceId;
}

export function matchesFilter(group: NpcVoiceGroup, filter: string): boolean {
    const needle = filter.trim().toLowerCase();
    return !needle || groupName(group).toLowerCase().includes(needle) || group.voiceId.includes(needle);
}

export function isGenerating(job: NpcVoiceJob | undefined): boolean {
    return !!job?.moods.some((m) => m.status === NpcMoodStatus.Pending);
}

export function moodLabel(mood: string): string {
    return mood.charAt(0).toUpperCase() + mood.slice(1);
}
