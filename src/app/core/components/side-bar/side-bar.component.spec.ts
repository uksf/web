import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SideBarComponent } from './side-bar.component';
import { of } from 'rxjs';
import { Permissions } from '@app/core/services/permissions';
import { ApplicationState } from '@app/features/application/models/application';
import { AppComponent } from '@app/app.component';

describe('SideBarComponent', () => {
    let component: SideBarComponent;
    let mockRouter: any;
    let mockPermissions: any;
    let mockAccountService: any;
    let mockHttpClient: any;
    let mockUrls: any;

    beforeEach(() => {
        mockRouter = { url: '/home' };
        mockPermissions = { getPermissions: vi.fn().mockReturnValue({}) };
        mockAccountService = { account: { displayName: 'User', application: null } };
        mockHttpClient = { get: vi.fn().mockReturnValue(of(0)) };
        mockUrls = { apiUrl: 'http://localhost:5500' };

        // Mock AppComponent static hub
        (AppComponent as any).utilityHubConnection = {
            connection: { on: vi.fn(), off: vi.fn() },
            reconnectEvent: of()
        };

        component = new SideBarComponent(
            mockRouter,
            mockPermissions,
            mockAccountService,
            mockHttpClient,
            mockUrls
        );
    });

    describe('getSideBarElements', () => {
        it('returns not-logged menu for UNLOGGED permission', () => {
            mockPermissions.getPermissions.mockReturnValue({ [Permissions.UNLOGGED]: true });

            const elements = component.getSideBarElements;

            expect(elements.map(e => e.text)).toContain('Home');
            expect(elements.map(e => e.text)).toContain('About');
            expect(elements.map(e => e.text)).toContain('Application');
            expect(elements.map(e => e.text)).not.toContain('Units');
        });

        it('returns guest menu for CONFIRMED permission', () => {
            mockPermissions.getPermissions.mockReturnValue({ [Permissions.CONFIRMED]: true });

            const elements = component.getSideBarElements;

            expect(elements.map(e => e.text)).toContain('Home');
            expect(elements.map(e => e.text)).toContain('Units');
            expect(elements.map(e => e.text)).toContain('Application');
        });

        it('adds modpack guide for guests with waiting application', () => {
            mockPermissions.getPermissions.mockReturnValue({ [Permissions.CONFIRMED]: true });
            mockAccountService.account = {
                displayName: 'User',
                application: { state: ApplicationState.WAITING }
            };

            const elements = component.getSideBarElements;

            expect(elements.map(e => e.text)).toContain('Modpack');
            expect(elements.find(e => e.text === 'Modpack').link).toBe('modpack/guide');
        });

        it('returns member menu for MEMBER permission', () => {
            mockPermissions.getPermissions.mockReturnValue({ [Permissions.MEMBER]: true });

            const elements = component.getSideBarElements;

            expect(elements.map(e => e.text)).toContain('Home');
            expect(elements.map(e => e.text)).toContain('Operations');
            expect(elements.map(e => e.text)).toContain('Personnel');
            expect(elements.map(e => e.text)).toContain('Modpack');
            expect(elements.map(e => e.text)).toContain('Information');
        });

        it('includes Recruitment for members with RECRUITER permission', () => {
            mockPermissions.getPermissions.mockReturnValue({
                [Permissions.MEMBER]: true,
                [Permissions.RECRUITER]: true
            });

            const elements = component.getSideBarElements;

            expect(elements.map(e => e.text)).toContain('Recruitment');
        });

        it('includes Command for members with COMMAND permission', () => {
            mockPermissions.getPermissions.mockReturnValue({
                [Permissions.MEMBER]: true,
                [Permissions.COMMAND]: true
            });

            const elements = component.getSideBarElements;

            expect(elements.map(e => e.text)).toContain('Command');
        });

        it('includes Admin for members with ADMIN permission', () => {
            mockPermissions.getPermissions.mockReturnValue({
                [Permissions.MEMBER]: true,
                [Permissions.ADMIN]: true
            });

            const elements = component.getSideBarElements;

            expect(elements.map(e => e.text)).toContain('Admin');
        });

        it('caches sidebar elements when permissions and account unchanged', () => {
            const perms = { [Permissions.MEMBER]: true };
            mockPermissions.getPermissions.mockReturnValue(perms);

            const first = component.getSideBarElements;
            const second = component.getSideBarElements;

            expect(first).toBe(second);
        });

        it('rebuilds menu when permissions change', () => {
            mockPermissions.getPermissions.mockReturnValue({ [Permissions.MEMBER]: true });
            const first = component.getSideBarElements;

            mockPermissions.getPermissions.mockReturnValue({
                [Permissions.MEMBER]: true,
                [Permissions.ADMIN]: true
            });
            const second = component.getSideBarElements;

            expect(first).not.toBe(second);
            expect(second.map(e => e.text)).toContain('Admin');
        });
    });

    describe('isSelected', () => {
        it('returns true when route matches link', () => {
            mockRouter.url = '/operations';

            expect(component.isSelected({ link: 'operations' })).toBe(true);
        });

        it('returns false when route does not match', () => {
            mockRouter.url = '/home';

            expect(component.isSelected({ link: 'operations' })).toBe(false);
        });

        it('matches full path for nested links', () => {
            mockRouter.url = '/information/about';

            expect(component.isSelected({ link: 'information/about' })).toBe(true);
        });
    });

    describe('trackByLink', () => {
        it('returns item link', () => {
            expect(component.trackByLink(0, { link: 'home' })).toBe('home');
        });
    });

    describe('onReceiveFrontendUpdate', () => {
        it('sets newVersion when version is higher', () => {
            component.version = 1;

            (component as any).onReceiveFrontendUpdate('2');

            expect(component.newVersion).toBe(true);
        });

        it('does not set newVersion when version is same', () => {
            component.version = 2;

            (component as any).onReceiveFrontendUpdate('2');

            expect(component.newVersion).toBe(false);
        });
    });

    describe('checkVersion', () => {
        it('fetches version from API', () => {
            mockHttpClient.get.mockReturnValue(of(5));

            component.checkVersion();

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/version');
            expect(component.version).toBe(5);
        });

        it('sets newVersion when API returns higher version', () => {
            component.version = 3;
            mockHttpClient.get.mockReturnValue(of(5));

            component.checkVersion();

            expect(component.newVersion).toBe(true);
        });

        it('does not set newVersion on initial load', () => {
            component.version = 0;
            mockHttpClient.get.mockReturnValue(of(5));

            component.checkVersion();

            expect(component.newVersion).toBe(false);
        });
    });

    describe('ngOnInit', () => {
        it('calls checkVersion and registers SignalR handler', () => {
            mockHttpClient.get.mockReturnValue(of(1));

            component.ngOnInit();

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/version');
            expect(AppComponent.utilityHubConnection.connection.on).toHaveBeenCalledWith(
                'ReceiveFrontendUpdate',
                expect.any(Function)
            );
        });
    });

    describe('ngOnDestroy', () => {
        it('deregisters SignalR handler', () => {
            component.ngOnInit();

            component.ngOnDestroy();

            expect(AppComponent.utilityHubConnection.connection.off).toHaveBeenCalledWith(
                'ReceiveFrontendUpdate',
                expect.any(Function)
            );
        });
    });
});
