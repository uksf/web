import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { OperationsMissionsComponent } from './operations-missions.component';
import { MissionsService } from '../../services/missions.service';
import { ServersHubService } from '../../services/servers-hub.service';
import { Mission } from '../../models/game-server';

export const makeMission = (overrides: Partial<Mission> = {}): Mission => ({
    name: 'co40_test',
    map: 'Altis',
    path: 'co40_test.Altis.pbo',
    size: 1024000,
    lastModified: '2026-01-15T12:00:00Z',
    ...overrides
});

export function setupMissionsComponent() {
    const reconnected$ = new Subject<void>();
    const mockMissionsService = {
        getActiveMissions: vi.fn().mockReturnValue(of([])),
        getArchivedMissions: vi.fn().mockReturnValue(of([])),
        uploadMission: vi.fn().mockReturnValue(of({ missions: [], missionReports: [] })),
        downloadMission: vi.fn().mockReturnValue(of(new Blob(['test']))),
        deleteMission: vi.fn().mockReturnValue(of(undefined)),
        archiveMission: vi.fn().mockReturnValue(of(undefined)),
        restoreMission: vi.fn().mockReturnValue(of(undefined))
    };
    const mockServersHub = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        connectionId: 'conn-123',
        reconnected$: reconnected$.asObservable()
    };
    const mockDialog = {
        open: vi.fn().mockReturnValue({ afterClosed: () => of(true) })
    };

    TestBed.configureTestingModule({
        providers: [
            OperationsMissionsComponent,
            { provide: MissionsService, useValue: mockMissionsService },
            { provide: ServersHubService, useValue: mockServersHub },
            { provide: MatDialog, useValue: mockDialog },
            provideRouter([])
        ]
    });
    return { component: TestBed.inject(OperationsMissionsComponent), mockMissionsService, mockServersHub, mockDialog, reconnected$ };
}
