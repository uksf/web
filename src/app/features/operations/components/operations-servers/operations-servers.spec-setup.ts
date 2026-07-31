import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { PermissionsService } from '@app/core/services/permissions.service';
import { GameServersService } from '../../services/game-servers.service';
import { ServersHubService } from '../../services/servers-hub.service';
import { StopPhase } from '../../models/game-server';
import { OperationsServersComponent } from './operations-servers.component';

export const makeServer = (overrides: Partial<any> = {}) => ({
    id: 'server1',
    name: 'Test Server',
    status: {
        parsedUptime: '01:30:45',
        stopPhase: StopPhase.None,
        killAllowedAt: null,
        launching: false,
        running: true,
        mission: 'test_mission',
        players: [],
        startedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
    },
    ...overrides
});

export function setupOperationsServersSpec() {
    (globalThis as any).window = { setInterval: vi.fn().mockReturnValue(1), clearInterval: vi.fn() };

    const dialogAfterClosed$ = new Subject<any>();
    const mockGameServersService: any = {
        getServers: vi.fn().mockReturnValue(of({ servers: [], instanceCount: 0, missions: [] })),
        getDisabledState: vi.fn().mockReturnValue(of(false)),
        toggleDisabledState: vi.fn().mockReturnValue(of(undefined)),
        deleteServer: vi.fn().mockReturnValue(of(undefined)),
        updateServerOrder: vi.fn().mockReturnValue(of(undefined)),
        uploadMission: vi.fn().mockReturnValue(of({ missions: [], missionReports: [] })),
        launchServer: vi.fn().mockReturnValue(of(undefined)),
        stopServer: vi.fn().mockReturnValue(of(undefined)),
        killServer: vi.fn().mockReturnValue(of(undefined)),
        killAllServers: vi.fn().mockReturnValue(of(undefined))
    };
    const mockDialog: any = {
        open: vi.fn().mockReturnValue({ afterClosed: () => dialogAfterClosed$.asObservable() })
    };
    const mockServersHub: any = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        reconnected$: new Subject<void>().asObservable()
    };
    const mockPermissions: any = {
        hasPermission: vi.fn().mockReturnValue(false)
    };

    TestBed.configureTestingModule({
        providers: [
            OperationsServersComponent,
            { provide: GameServersService, useValue: mockGameServersService },
            { provide: MatDialog, useValue: mockDialog },
            { provide: ServersHubService, useValue: mockServersHub },
            { provide: PermissionsService, useValue: mockPermissions },
            { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
        ]
    });

    return {
        component: TestBed.inject(OperationsServersComponent),
        mockGameServersService,
        mockDialog,
        mockServersHub,
        mockPermissions,
        dialogAfterClosed$
    };
}

export function teardownOperationsServersSpec() {
    delete (globalThis as any).window;
}
