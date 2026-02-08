import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HeaderBarComponent } from './header-bar.component';
import { Environments } from '@app/core/services/app-settings.service';

describe('HeaderBarComponent', () => {
    let component: HeaderBarComponent;
    let mockPermissionsService: any;
    let mockAccountService: any;
    let mockDialog: any;
    let mockAppSettings: any;
    let mockAuth: any;

    beforeEach(() => {
        (globalThis as any).window = { screen: { width: 1024 } };
        mockPermissionsService = { revoke: vi.fn() };
        mockAccountService = { account: { displayName: 'Test User' } };
        mockDialog = { open: vi.fn() };
        mockAppSettings = { appSetting: vi.fn().mockReturnValue(Environments.Production) };
        mockAuth = { isImpersonated: vi.fn().mockReturnValue(false) };

        component = new HeaderBarComponent(
            mockPermissionsService,
            mockAccountService,
            mockDialog,
            mockAppSettings,
            mockAuth
        );
    });

    afterEach(() => {
        delete (globalThis as any).window;
    });

    describe('constructor', () => {
        it('reads environment from app settings', () => {
            expect(mockAppSettings.appSetting).toHaveBeenCalledWith('environment');
            expect(component.currentEnvironment).toBe(Environments.Production);
        });
    });

    describe('getName', () => {
        it('returns account display name', () => {
            expect(component.getName).toBe('Test User');
        });

        it('returns undefined when account is null', () => {
            mockAccountService.account = null;

            expect(component.getName).toBeUndefined();
        });
    });

    describe('profileColor', () => {
        it('returns primary for production', () => {
            expect(component.profileColor).toBe('primary');
        });

        it('returns warn for development', () => {
            component.currentEnvironment = Environments.Development;

            expect(component.profileColor).toBe('warn');
        });

        it('returns impersonated when impersonating', () => {
            mockAuth.isImpersonated.mockReturnValue(true);

            expect(component.profileColor).toBe('impersonated');
        });

        it('prioritises impersonated over development', () => {
            mockAuth.isImpersonated.mockReturnValue(true);
            component.currentEnvironment = Environments.Development;

            expect(component.profileColor).toBe('impersonated');
        });
    });

    describe('logout', () => {
        it('revokes permissions', () => {
            component.logout();

            expect(mockPermissionsService.revoke).toHaveBeenCalled();
        });
    });

    describe('openLOAModal', () => {
        it('opens LOA dialog', () => {
            component.openLOAModal();

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {});
        });
    });

    describe('ngOnInit', () => {
        it('sets mobile false for desktop', () => {
            component.ngOnInit();

            expect(component.mobile).toBe(false);
            expect(component.mobileSmall).toBe(false);
        });

        it('sets mobile true for tablet width', () => {
            (globalThis as any).window.screen.width = 600;

            component.ngOnInit();

            expect(component.mobile).toBe(true);
        });
    });

    describe('onResize', () => {
        it('updates mobile flags', () => {
            (globalThis as any).window.screen.width = 375;

            component.onResize();

            expect(component.mobileSmall).toBe(true);
        });
    });
});
