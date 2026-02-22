import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RecruitmentPageComponent } from './recruitment-page.component';
import { of, Subject } from 'rxjs';

describe('RecruitmentPageComponent', () => {
    let component: RecruitmentPageComponent;
    let mockDialog: any;
    let mockRecruitmentService: any;
    let mockAccountService: any;
    let mockPermissions: any;
    let mockSignalrService: any;

    beforeEach(() => {
        (globalThis as any).window = { setInterval: vi.fn().mockReturnValue(1), clearInterval: vi.fn() };
        mockDialog = { open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }) };
        mockRecruitmentService = {
            getActiveApplications: vi.fn().mockReturnValue(of([])),
            getRecruiters: vi.fn().mockReturnValue(of([])),
            getCompletedApplications: vi.fn().mockReturnValue(of({ data: [], totalCount: 0 })),
            getRecruitmentStats: vi.fn().mockReturnValue(of({ yourStats: null, sr1Stats: null })),
            getRecruitmentActivity: vi.fn().mockReturnValue(of([]))
        };
        mockAccountService = {
            account: { id: 'user-1' }
        };
        mockPermissions = {
            hasPermission: vi.fn().mockReturnValue(false)
        };
        mockSignalrService = {
            connect: vi.fn().mockReturnValue({
                connection: { connectionId: 'conn-1', on: vi.fn(), off: vi.fn(), stop: vi.fn().mockReturnValue(Promise.resolve()) },
                reconnectEvent: of(),
                dispose: vi.fn()
            })
        };

        component = new RecruitmentPageComponent(
            mockDialog,
            mockRecruitmentService,
            mockAccountService,
            mockPermissions,
            mockSignalrService
        );
    });

    afterEach(() => {
        delete (globalThis as any).window;
    });

    describe('trackByActiveApplication', () => {
        it('returns account id for active application', () => {
            const application = { account: { id: 'app-123', application: {} } } as any;

            expect(component.trackByActiveApplication(0, application)).toBe('app-123');
        });
    });

    describe('updateApplicationColours', () => {
        it('should set _colour green for negative processingDifference', () => {
            component.userActiveApplications = [
                { account: { id: 'a1' }, processingDifference: -1, daysProcessing: 5, steamProfile: '', recruiter: '' } as any
            ];

            component.updateApplicationColours();

            expect(component.userActiveApplications[0]._colour).toBe('green');
        });

        it('should set _colour red for processingDifference > 10', () => {
            component.allOtherActiveApplications = [
                { account: { id: 'a2' }, processingDifference: 11, daysProcessing: 15, steamProfile: '', recruiter: '' } as any
            ];

            component.updateApplicationColours();

            expect(component.allOtherActiveApplications[0]._colour).toBe('red');
        });

        it('should set _colour orange for processingDifference > 7', () => {
            component.userActiveApplications = [
                { account: { id: 'a3' }, processingDifference: 8, daysProcessing: 12, steamProfile: '', recruiter: '' } as any
            ];

            component.updateApplicationColours();

            expect(component.userActiveApplications[0]._colour).toBe('orange');
        });
    });

    describe('trackByApplication', () => {
        it('returns account id for completed application', () => {
            const application = { account: { id: 'comp-456' } } as any;

            expect(component.trackByApplication(0, application)).toBe('comp-456');
        });
    });
});
