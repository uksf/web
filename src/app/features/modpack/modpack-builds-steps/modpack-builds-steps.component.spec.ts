import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ModpackBuildsStepsComponent } from './modpack-builds-steps.component';
import { HubConnectionFactory } from '@app/core/services/hub-connection-factory';
import { PermissionsService } from '@app/core/services/permissions.service';
import { ModpackBuildProcessService } from '../modpackBuildProcess.service';
import { ModpackBuild } from '../models/modpack-build';
import { ModpackBuildStep } from '../models/modpack-build-step';
import { ModpackBuildResult } from '../models/modpack-build-result';

function makeStep(index: number, running: boolean, finished: boolean): ModpackBuildStep {
    return { index, name: `Step ${index}`, running, finished, buildResult: finished ? ModpackBuildResult.SUCCESS : ModpackBuildResult.NONE, logs: [] } as unknown as ModpackBuildStep;
}

function makeBuild(id: string, buildNumber: number, running: boolean): ModpackBuild {
    return {
        id,
        buildNumber,
        running,
        finished: !running,
        buildResult: running ? ModpackBuildResult.NONE : ModpackBuildResult.SUCCESS,
        steps: [makeStep(0, false, true), makeStep(1, running, !running), makeStep(2, false, !running)]
    } as unknown as ModpackBuild;
}

describe('ModpackBuildsStepsComponent', () => {
    let component: ModpackBuildsStepsComponent;
    let buildData: Record<string, Subject<ModpackBuild>>;
    let hubs: { endpoint: string; handlers: Record<string, (arg: unknown) => void>; disconnect: ReturnType<typeof vi.fn> }[];
    let mockRouter: { navigate: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        buildData = {};
        hubs = [];
        mockRouter = { navigate: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                ModpackBuildsStepsComponent,
                {
                    provide: HubConnectionFactory,
                    useValue: {
                        connect: (endpoint: string) => {
                            const hub = {
                                endpoint,
                                handlers: {} as Record<string, (arg: unknown) => void>,
                                disconnect: vi.fn(),
                                reconnected$: new Subject<void>(),
                                on(event: string, callback: (arg: unknown) => void) {
                                    hub.handlers[event] = callback;
                                }
                            };
                            hubs.push(hub);
                            return hub;
                        }
                    }
                },
                {
                    provide: ModpackBuildProcessService,
                    useValue: {
                        getBuildData: (id: string) => {
                            buildData[id] = new Subject<ModpackBuild>();
                            return buildData[id];
                        }
                    }
                },
                { provide: PermissionsService, useValue: { hasPermission: () => false } },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
                { provide: Router, useValue: mockRouter }
            ]
        });
        component = TestBed.inject(ModpackBuildsStepsComponent);
        component.scrollView = { scrollTo: vi.fn(), scrollToIndex: vi.fn() } as never;
    });

    function switchBuild(to: ModpackBuild) {
        const previous = component.build;
        component.build = to;
        component.ngOnChanges({ build: new SimpleChange(previous, to, false) });
    }

    it('does not open a hub for a build the user switched away from before its data loaded', () => {
        const running = makeBuild('a', 10, true);
        const finished = makeBuild('b', 9, false);
        component.build = running;
        component.ngOnInit();

        switchBuild(finished);
        buildData['a'].next(makeBuild('a', 10, true));
        buildData['b'].next(makeBuild('b', 9, false));

        expect(hubs.filter((hub) => !hub.disconnect.mock.calls.length).map((hub) => hub.endpoint)).toEqual([]);
        expect(component.build.id).toBe('b');
    });

    it('ignores a step from the old build hub after switching builds', () => {
        const running = makeBuild('a', 10, true);
        const finished = makeBuild('b', 9, false);
        component.build = running;
        component.ngOnInit();
        buildData['a'].next(makeBuild('a', 10, true));
        const oldHub = hubs[0];

        switchBuild(finished);
        oldHub.handlers['ReceiveBuildStep'](makeStep(2, true, false));

        expect(finished.steps[2].running).toBe(false);
        expect(component.build.steps[2].running).toBe(false);
    });

    it('stops reacting to build steps after the component is destroyed', () => {
        component.build = makeBuild('a', 10, true);
        component.ngOnInit();
        buildData['a'].next(makeBuild('a', 10, true));
        const hub = hubs[0];
        component.ngOnDestroy();
        mockRouter.navigate.mockClear();

        hub.handlers['ReceiveBuildStep'](makeStep(1, false, true));
        hub.handlers['ReceiveBuildStep'](makeStep(2, true, false));

        expect(hub.disconnect).toHaveBeenCalled();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
});
