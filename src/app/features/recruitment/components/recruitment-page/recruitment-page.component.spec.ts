import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RecruitmentPageComponent } from './recruitment-page.component';
import { of, Subject } from 'rxjs';
import { AccountService } from '@app/core/services/account.service';
import { RecruitmentService } from '../../services/recruitment.service';
import { ProfileService } from '@app/features/profile/services/profile.service';
import { Router } from '@angular/router';

describe('RecruitmentPageComponent', () => {
    let component: RecruitmentPageComponent;
    let mockRecruitmentService: any;
    let mockAccountService: any;
    let mockProfileService: any;
    let mockRouter: any;

    beforeEach(() => {
        mockRecruitmentService = {
            getActiveApplications: vi.fn().mockReturnValue(of([])),
            getRecruiters: vi.fn().mockReturnValue(of([])),
            getCompletedApplications: vi.fn().mockReturnValue(of({ data: [], totalCount: 0 })),
            getRecruitmentStats: vi.fn().mockReturnValue(of({ yourStats: null, sr1Stats: null })),
            getRecruitmentActivity: vi.fn().mockReturnValue(of([])),
            getStats: vi.fn().mockReturnValue(of({ activity: [], yourStats: null, sr1Stats: null })),
            getTeamspeakOnlineState: vi.fn().mockReturnValue(of({}))
        };
        mockAccountService = {
            account: { id: 'user-1' }
        };
        mockProfileService = {
            updateSetting: vi.fn().mockReturnValue(of({}))
        };
        mockRouter = {
            navigate: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                RecruitmentPageComponent,
                { provide: AccountService, useValue: mockAccountService },
                { provide: RecruitmentService, useValue: mockRecruitmentService },
                { provide: ProfileService, useValue: mockProfileService },
                { provide: Router, useValue: mockRouter },
            ]
        });
        component = TestBed.inject(RecruitmentPageComponent);
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
