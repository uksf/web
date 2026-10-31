import { prepare, layout } from '@chenglou/pretext';
import { Mission } from '../models/game-server';
import { capitaliseMapName } from './map-colour';

export type MissionSortField = 'name' | 'date' | 'map';
export type MissionSortDirection = 'asc' | 'desc';

export interface MissionGroup {
    map: string;
    missions: Mission[];
}

export interface MissionSortDefinition {
    field: MissionSortField;
    direction: MissionSortDirection;
    name: string;
}

export const MISSION_SORT_DEFINITIONS: MissionSortDefinition[] = [
    { field: 'name', direction: 'asc', name: 'Name (A - Z)' },
    { field: 'name', direction: 'desc', name: 'Name (Z - A)' },
    { field: 'date', direction: 'desc', name: 'Date (Newest)' },
    { field: 'date', direction: 'asc', name: 'Date (Oldest)' },
    { field: 'map', direction: 'asc', name: 'Map (A - Z)' },
    { field: 'map', direction: 'desc', name: 'Map (Z - A)' }
];

const compareText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

export function groupMissionsByMap(missions: Mission[]): MissionGroup[] {
    const groupMap = new Map<string, Mission[]>();
    for (const mission of missions) {
        const key = mission.map.toLowerCase();
        const existing = groupMap.get(key);
        if (existing) {
            existing.push(mission);
        } else {
            groupMap.set(key, [mission]);
        }
    }
    return Array.from(groupMap.entries())
        .map(([key, missionList]) => ({ map: capitaliseMapName(key), missions: missionList }))
        .sort((a, b) => compareText(a.map, b.map));
}

export function sortMissions(missions: Mission[], field: MissionSortField, direction: MissionSortDirection): Mission[] {
    const dir = direction === 'asc' ? 1 : -1;
    return [...missions].sort((a, b) => {
        switch (field) {
            case 'name':
                return compareText(a.name, b.name) * dir;
            case 'date':
                return (new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()) * dir;
            case 'map':
            default:
                return (compareText(a.map, b.map) || compareText(a.name, b.name)) * dir;
        }
    });
}

export function missionMatches(filter: string): (mission: Mission) => boolean {
    const needle = filter.trim().toLowerCase();
    return (m: Mission) => !needle || m.name.toLowerCase().includes(needle) || m.map.toLowerCase().includes(needle);
}

const MAP_LABEL_AVAILABLE_WIDTH = 88;
const MAP_LABEL_MAX_LINES = 2;
const MAP_FONT_STEPS = [14, 13, 12, 11, 10, 9];
const mapFontCache = new Map<string, string>();

function computeMapFontSize(text: string): string {
    if (!text || typeof document === 'undefined') return '14px';
    for (const size of MAP_FONT_STEPS) {
        try {
            const prepared = prepare(text, `500 ${size}px Roboto, Helvetica, Arial, sans-serif`);
            const { lineCount } = layout(prepared, MAP_LABEL_AVAILABLE_WIDTH, size * 1.1);
            if (lineCount <= MAP_LABEL_MAX_LINES) return `${size}px`;
        } catch {
            return '14px';
        }
    }
    return `${MAP_FONT_STEPS[MAP_FONT_STEPS.length - 1]}px`;
}

export function mapLabelFontSize(map: string): string {
    const text = capitaliseMapName(map);
    const cached = mapFontCache.get(text);
    if (cached) return cached;
    const size = computeMapFontSize(text);
    mapFontCache.set(text, size);
    return size;
}
