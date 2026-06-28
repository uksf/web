const KNOWN_MAPS: Record<string, string> = {
    altis: '#c2a878',
    stratis: '#9eb56b',
    malden: '#7cb0d4',
    tanoa: '#2d9d5f',
    livonia: '#4a7c42',
    vr: '#06b6d4',
    chernarus: '#7a9153',
    takistan: '#d4a574',
    sahrani: '#14b8a6',
    lingor: '#2d6b3f',
    panthera: '#059669',
    fallujah: '#e07b3c',
    kunduz: '#c89963',
    reshmaan: '#a05a3e',
    zargabad: '#e8944a',
    porto: '#3b82f6',
    bystrica: '#d97706',
    virolahti: '#3f6e3a',
    sara: '#4ba0c4'
};

const FALLBACK_HUES = [0, 15, 30, 120, 145, 170, 190, 210, 235, 265, 295, 325];

function hashString(str: string): number {
    let hash = 0;
    const lower = str.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
        hash = lower.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

export function mapBorderColour(mapName: string): string {
    if (!mapName) return 'hsl(0, 0%, 50%)';
    const key = mapName.toLowerCase();
    const known = KNOWN_MAPS[key];
    if (known) return known;
    const hue = FALLBACK_HUES[hashString(key) % FALLBACK_HUES.length];
    return `hsl(${hue}, 65%, 55%)`;
}

export function capitaliseMapName(mapName: string): string {
    if (!mapName) return '';
    const lower = mapName.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function mapTokenFromMission(missionName: string | undefined): string {
    // mission file name is `name.Map.pbo` — pull the map token for colour/label.
    const withoutExt = missionName?.replace(/\.pbo$/i, '') ?? '';
    const lastDot = withoutExt.lastIndexOf('.');
    return lastDot > 0 ? withoutExt.slice(lastDot + 1) : '';
}
