import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ApplicationPageComponent } from './application-page.component';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '@app/core/services/account.service';
import { ApplicationService } from '../../services/application.service';
import { ApplicationAnalyticsService } from '../../services/application-analytics.service';
import { MembershipState } from '@app/shared/models/account';
import { ApplicationState } from '../../models/application';
import { of } from 'rxjs';

describe('ApplicationPageComponent', () => {
    let component: ApplicationPageComponent;
    let mockDialog: any;
    let mockAccountService: any;
    let mockApplicationService: any;
    let mockAnalytics: any;

    function createAccount(overrides: any = {}) {
        return {
            id: 'test-id',
            email: 'test@example.com',
            membershipState: MembershipState.CONFIRMED,
            teamspeakIdentities: [],
            steamname: '',
            discordId: '',
            application: null,
            ...overrides
        };
    }

    beforeEach(() => {
        mockDialog = { open: vi.fn() };
        mockApplicationService = {
            submitApplication: vi.fn().mockReturnValue(of(undefined))
        };
        mockAnalytics = {
            trackEvent: vi.fn()
        };
        mockAccountService = {
            account: createAccount({ membershipState: MembershipState.UNCONFIRMED }),
            getAccount: vi.fn().mockReturnValue(of(undefined))
        };

        TestBed.configureTestingModule({
            providers: [
                ApplicationPageComponent,
                { provide: MatDialog, useValue: mockDialog },
                { provide: AccountService, useValue: mockAccountService },
                { provide: ApplicationService, useValue: mockApplicationService },
                { provide: ApplicationAnalyticsService, useValue: mockAnalytics }
            ]
        });
        component = TestBed.inject(ApplicationPageComponent);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('checkStep', () => {
        it('should set step 3 when membership state is UNCONFIRMED', () => {
            mockAccountService.account = createAccount({ membershipState: MembershipState.UNCONFIRMED });

            component.checkStep();

            expect(component.step).toBe(3);
        });

        it('should set step 4 when confirmed but not connected', () => {
            mockAccountService.account = createAccount({ membershipState: MembershipState.CONFIRMED });

            component.checkStep();

            expect(component.step).toBe(4);
        });

        it('should set step 5 when connected but not submitted', () => {
            mockAccountService.account = createAccount({
                membershipState: MembershipState.CONFIRMED,
                teamspeakIdentities: ['ts-id'],
                steamname: 'steam',
                discordId: 'discord'
            });

            component.checkStep();

            expect(component.step).toBe(5);
        });

        it('should set step 6 when application is submitted', () => {
            mockAccountService.account = createAccount({
                membershipState: MembershipState.CONFIRMED,
                application: { state: ApplicationState.ACCEPTED }
            });

            component.checkStep();

            expect(component.step).toBe(6);
        });
    });

    describe('next', () => {
        it('should track account_created when completing step 2', () => {
            vi.useFakeTimers();
            component.step = 2;

            component.next(undefined);
            vi.advanceTimersByTime(10);

            expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('account_created');
            vi.useRealTimers();
        });

        it('should track comms_linked when completing step 4', () => {
            vi.useFakeTimers();
            component.step = 4;

            component.next(undefined);
            vi.advanceTimersByTime(10);

            expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('comms_linked');
            vi.useRealTimers();
        });
    });

    describe('email confirmation tracking', () => {
        it('should track email_confirmed when email is confirmed via checkStep transition', () => {
            component.step = 3;
            mockAccountService.account = createAccount({ membershipState: MembershipState.CONFIRMED });

            component.checkStep();

            expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('email_confirmed');
        });

        it('should NOT track email_confirmed on initial load to step 4', () => {
            component.step = 1;
            mockAccountService.account = createAccount({ membershipState: MembershipState.CONFIRMED });

            component.checkStep();

            expect(mockAnalytics.trackEvent).not.toHaveBeenCalledWith('email_confirmed');
        });
    });

    describe('loggedOut', () => {
        it('should return true when account is undefined', () => {
            mockAccountService.account = undefined;

            expect(component.loggedOut()).toBe(true);
        });

        it('should return false when account exists', () => {
            expect(component.loggedOut()).toBe(false);
        });
    });

    describe('submit', () => {
        it('should track application_submitted on success', () => {
            mockAccountService.account = createAccount({
                membershipState: MembershipState.CONFIRMED,
                teamspeakIdentities: ['ts'],
                steamname: 'steam',
                discordId: 'discord'
            });

            component.submit('test details');

            expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('application_submitted');
        });
    });
});
