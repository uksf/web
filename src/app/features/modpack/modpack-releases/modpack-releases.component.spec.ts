import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ModpackReleasesComponent } from './modpack-releases.component';
import { PermissionsService } from '@app/core/services/permissions.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ModpackReleaseService } from '../modpackRelease.service';
import { GameDataExportService } from '../services/game-data-export.service';
import { GameDataExport } from '../models/game-data-export';

describe('ModpackReleasesComponent', () => {
    let component: ModpackReleasesComponent;
    let mockPermissionsService: any;
    let mockRoute: any;
    let mockRouter: any;
    let mockModpackReleaseService: any;
    let mockGameDataExportService: any;

    beforeEach(() => {
        mockPermissionsService = {
            hasPermission: vi.fn().mockReturnValue(false)
        };
        mockRoute = {
            snapshot: { queryParams: {} }
        };
        mockRouter = {
            navigate: vi.fn()
        };
        mockModpackReleaseService = {
            releases: [],
            connect: vi.fn(),
            disconnect: vi.fn()
        };
        mockGameDataExportService = {
            list: vi.fn().mockReturnValue(of([])),
            download: vi.fn().mockReturnValue(of(new Blob(['x'])))
        };

        TestBed.configureTestingModule({
            providers: [
                ModpackReleasesComponent,
                { provide: PermissionsService, useValue: mockPermissionsService },
                { provide: ActivatedRoute, useValue: mockRoute },
                { provide: Router, useValue: mockRouter },
                { provide: ModpackReleaseService, useValue: mockModpackReleaseService },
                { provide: GameDataExportService, useValue: mockGameDataExportService },
            ]
        });
        component = TestBed.inject(ModpackReleasesComponent);
    });

    describe('ngOnDestroy', () => {
        it('should disconnect from modpack release service', () => {
            component.ngOnDestroy();

            expect(mockModpackReleaseService.disconnect).toHaveBeenCalled();
        });
    });

    describe('latestReleaseIsDraft', () => {
        it('returns false when no releases', () => {
            component.updateCachedState();
            expect(component.latestReleaseIsDraft).toBe(false);
        });

        it('returns true when first release is draft', () => {
            mockModpackReleaseService.releases = [{ isDraft: true, version: '1.0' }];
            component.updateCachedState();

            expect(component.latestReleaseIsDraft).toBe(true);
        });

        it('returns false when first release is not draft', () => {
            mockModpackReleaseService.releases = [{ isDraft: false, version: '1.0' }];
            component.updateCachedState();

            expect(component.latestReleaseIsDraft).toBe(false);
        });
    });

    describe('updateCachedState', () => {
        it('should cache publicReleases from filtered releases', () => {
            mockModpackReleaseService.releases = [
                { isDraft: false, version: '1.0' },
                { isDraft: true, version: '2.0' }
            ];

            component.updateCachedState();

            expect(component.publicReleases).toHaveLength(1);
            expect(component.publicReleases[0].version).toBe('1.0');
        });

        it('should include drafts for testers', () => {
            mockPermissionsService.hasPermission.mockReturnValue(true);
            mockModpackReleaseService.releases = [
                { isDraft: false, version: '1.0' },
                { isDraft: true, version: '2.0' }
            ];

            component.updateCachedState();

            expect(component.publicReleases).toHaveLength(2);
        });

        it('should cache selectedRelease from releases matching selectedReleaseVersion', () => {
            mockModpackReleaseService.releases = [
                { isDraft: false, version: '1.0', changelog: 'test' },
                { isDraft: false, version: '2.0', changelog: 'test2' }
            ];
            component.selectedReleaseVersion = '2.0';

            component.updateCachedState();

            expect(component.selectedRelease).toBeDefined();
            expect(component.selectedRelease.version).toBe('2.0');
        });

        it('should set selectedRelease to undefined when no match', () => {
            mockModpackReleaseService.releases = [
                { isDraft: false, version: '1.0' }
            ];
            component.selectedReleaseVersion = '999.0';

            component.updateCachedState();

            expect(component.selectedRelease).toBeUndefined();
        });
    });

    describe('data exports', () => {
        const sampleExport: GameDataExport = {
            id: 'a',
            modpackVersion: '5.23.9',
            gameVersion: '2.18',
            status: 'Success',
            hasConfig: true,
            hasCbaSettings: true,
            hasCbaSettingsReference: false,
            completedAt: '2026-05-01T00:00:00Z'
        };

        it('hasDataExport returns false before load', () => {
            expect(component.hasDataExport('5.23.9')).toBe(false);
        });

        it('ngOnInit loads exports for ADMIN and populates lookup', () => {
            mockPermissionsService.hasPermission.mockReturnValue(true);
            mockGameDataExportService.list.mockReturnValue(of([sampleExport]));

            component.ngOnInit();

            expect(mockGameDataExportService.list).toHaveBeenCalled();
            expect(component.hasDataExport('5.23.9')).toBe(true);
            expect(component.getDataExport('5.23.9')).toEqual(sampleExport);
        });

        it('ngOnInit does not load exports for non-ADMIN', () => {
            mockPermissionsService.hasPermission.mockReturnValue(false);

            component.ngOnInit();

            expect(mockGameDataExportService.list).not.toHaveBeenCalled();
        });

        describe('download', () => {
            const originalCreateObjectURL = (globalThis as any).URL?.createObjectURL;
            const originalRevokeObjectURL = (globalThis as any).URL?.revokeObjectURL;

            beforeEach(() => {
                (globalThis as any).URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
                (globalThis as any).URL.revokeObjectURL = vi.fn();
            });

            afterEach(() => {
                (globalThis as any).URL.createObjectURL = originalCreateObjectURL;
                (globalThis as any).URL.revokeObjectURL = originalRevokeObjectURL;
            });

            it('downloads cba-settings with correct filename', () => {
                const blob = new Blob(['sqf']);
                mockGameDataExportService.download.mockReturnValue(of(blob));
                const anchor: any = { click: vi.fn() };
                const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor as HTMLAnchorElement);

                component.download('5.23.9', 'cba-settings');

                expect(mockGameDataExportService.download).toHaveBeenCalledWith('5.23.9', 'cba-settings');
                expect((globalThis as any).URL.createObjectURL).toHaveBeenCalledWith(blob);
                expect(anchor.download).toBe('cba_settings_5.23.9.sqf');
                expect(anchor.click).toHaveBeenCalled();
                expect((globalThis as any).URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
                createElementSpy.mockRestore();
            });

            it('downloads config with correct filename', () => {
                mockGameDataExportService.download.mockReturnValue(of(new Blob(['cpp'])));
                const anchor: any = { click: vi.fn() };
                const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor as HTMLAnchorElement);

                component.download('5.23.9', 'config');

                expect(anchor.download).toBe('config_5.23.9.cpp');
                createElementSpy.mockRestore();
            });

            it('downloads cba-settings-reference with correct filename', () => {
                mockGameDataExportService.download.mockReturnValue(of(new Blob(['json'])));
                const anchor: any = { click: vi.fn() };
                const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor as HTMLAnchorElement);

                component.download('5.23.9', 'cba-settings-reference');

                expect(anchor.download).toBe('cba_settings_reference_5.23.9.json');
                createElementSpy.mockRestore();
            });
        });
    });

    describe('formatChangelog', () => {
        it('removes <br> tags when entering edit mode', () => {
            component.changelogStaging = 'line1<br>  indented<br>  also';

            component.formatChangelog(true);

            expect(component.changelogEditing).toBe('line1  indented  also');
        });

        it('adds <br> to indented non-list lines when exiting edit mode', () => {
            component.changelogEditing = '# Header\n  indented line\n  - list item';

            component.formatChangelog(false);

            expect(component.changelogStaging).toContain('<br>  indented line');
            expect(component.changelogStaging).not.toContain('<br>  - list item');
        });
    });
});
