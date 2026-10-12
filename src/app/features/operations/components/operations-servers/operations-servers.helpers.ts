import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { GameServer, Mission, StopPhase } from '../../models/game-server';

export function serverStatusLabel(server: GameServer): string {
    if (server.status.stopPhase === StopPhase.Ending) return 'Ending';
    if (server.status.stopPhase === StopPhase.Saving) return 'Saving';
    if (server.status.stopPhase === StopPhase.Delivering) return 'Saving to API';
    if (server.status.stopPhase === StopPhase.Stopping) return 'Stopping';
    if (server.status.launching) return 'Launching';
    if (!server.status.running) return 'Offline';
    if (!server.status.startedAt) return 'Waiting';
    return 'Running';
}

export function isServerStopping(server: GameServer): boolean {
    return server.status.stopPhase !== StopPhase.None;
}

export function isServerSaving(server: GameServer): boolean {
    return [StopPhase.Ending, StopPhase.Saving, StopPhase.Delivering].includes(server.status.stopPhase);
}

export function killConfirmationMessage(server: GameServer): string {
    if (isServerSaving(server)) {
        return `'${server.name}' is still saving. Killing it now loses any persistence data that has not reached the API. Kill it anyway?`;
    }

    return `Are you sure you want to kill '${server.name}'? This could have unexpected effects on the server`;
}

export function killAllConfirmationMessage(servers: GameServer[], instanceCount: number): string {
    const saving = (servers ?? []).filter(isServerSaving).map((server) => server.name);
    if (saving.length > 0) {
        const names = saving.length === 1 ? `${saving[0]} is` : `${saving.slice(0, -1).join(', ')} and ${saving[saving.length - 1]} are`;
        return `${names} still saving. Killing all ${instanceCount} servers now loses any persistence data that has not reached the API. Kill them anyway?`;
    }

    return `Are you sure you want to kill ${instanceCount} servers?\nThere could be players still on and this could have unexpected effects on the server`;
}

export function isServerKillAllowed(server: GameServer): boolean {
    if (!isServerStopping(server)) {
        return true;
    }

    return !!server.status.killAllowedAt && Date.now() >= Date.parse(server.status.killAllowedAt);
}

export function applyUptimes(servers: GameServer[], nowMs: number): boolean {
    let changed = false;

    servers.forEach((server) => {
        if (!server.status.startedAt || !server.status.running) return;
        const elapsed = Math.floor((nowMs - new Date(server.status.startedAt).getTime()) / 1000);
        if (elapsed < 0) return;
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        const uptime = `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        if (server.status.parsedUptime !== uptime) {
            server.status.parsedUptime = uptime;
            changed = true;
        }
    });

    return changed;
}

export function mapMission(dropdownElement: IDropdownElement): Mission {
    return {
        path: dropdownElement.value,
        name: dropdownElement.displayValue,
        map: dropdownElement.data as string,
        size: 0,
        lastModified: ''
    };
}

export function mapMissionElement(mission: Mission): IDropdownElement {
    return {
        value: mission.path,
        displayValue: mission.name,
        data: mission.map
    };
}

export function missionName(element: IDropdownElement): string {
    const mission = mapMission(element);
    return `${mission.map}, ${mission.name}`;
}
