import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModpackReleasesComponent } from './modpack-releases.component';

describe('ModpackReleasesComponent', () => {
    let component: ModpackReleasesComponent;
    let mockMarkdownService: any;
    let mockPermissionsService: any;
    let mockRoute: any;
    let mockRouter: any;
    let mockModpackReleaseService: any;
    let originalLinkRenderer: any;

    beforeEach(() => {
        originalLinkRenderer = vi.fn().mockReturnValue('<a href="test">link</a>');
        mockMarkdownService = {
            renderer: {
                link: originalLinkRenderer
            },
            compile: vi.fn().mockReturnValue('')
        };
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

        component = new ModpackReleasesComponent(
            mockMarkdownService,
            mockPermissionsService,
            mockRoute,
            mockRouter,
            mockModpackReleaseService
        );
    });

    describe('ngOnInit', () => {
        it('should override the markdown link renderer to add target=_blank', () => {
            component.ngOnInit();

            // The renderer should now be a different function
            expect(mockMarkdownService.renderer.link).not.toBe(originalLinkRenderer);
        });
    });

    describe('ngOnDestroy', () => {
        it('should restore the original markdown link renderer', () => {
            component.ngOnInit();
            expect(mockMarkdownService.renderer.link).not.toBe(originalLinkRenderer);

            component.ngOnDestroy();

            expect(mockMarkdownService.renderer.link).toBe(originalLinkRenderer);
        });

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
