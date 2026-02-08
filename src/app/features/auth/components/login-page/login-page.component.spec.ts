import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPageComponent } from './login-page.component';
import { Subject } from 'rxjs';
import { NavigationEnd } from '@angular/router';

describe('LoginPageComponent', () => {
    let component: LoginPageComponent;
    let mockRoute: any;
    let mockRouter: any;
    let routerEvents$: Subject<any>;

    beforeEach(() => {
        routerEvents$ = new Subject<any>();
        mockRoute = {
            snapshot: {
                queryParams: {}
            }
        };
        mockRouter = {
            events: routerEvents$.asObservable()
        };

        component = new LoginPageComponent(mockRoute, mockRouter);
    });

    describe('checkReset', () => {
        it('sets reset mode when reset query param present', () => {
            mockRoute.snapshot.queryParams = { reset: 'abc123' };

            component.checkReset();

            expect(component.resetPasswordCode).toBe('abc123');
            expect(component.mode).toBe(2);
        });

        it('sets mode 0 when no reset param', () => {
            mockRoute.snapshot.queryParams = {};
            component.mode = 2;

            component.checkReset();

            expect(component.mode).toBe(0);
        });
    });

    describe('setMode', () => {
        it('sets mode value', () => {
            component.setMode(1);
            expect(component.mode).toBe(1);

            component.setMode(2);
            expect(component.mode).toBe(2);
        });
    });

    describe('ngOnInit', () => {
        it('calls checkReset on init', () => {
            mockRoute.snapshot.queryParams = { reset: 'init-code' };

            component.ngOnInit();

            expect(component.resetPasswordCode).toBe('init-code');
            expect(component.mode).toBe(2);
        });

        it('rechecks on NavigationEnd events', () => {
            component.ngOnInit();

            mockRoute.snapshot.queryParams = { reset: 'nav-code' };
            routerEvents$.next(new NavigationEnd(1, '/login', '/login'));

            expect(component.resetPasswordCode).toBe('nav-code');
            expect(component.mode).toBe(2);
        });
    });

    describe('ngOnDestroy', () => {
        it('stops listening to router events', () => {
            component.ngOnInit();
            component.ngOnDestroy();

            mockRoute.snapshot.queryParams = { reset: 'after-destroy' };
            routerEvents$.next(new NavigationEnd(2, '/login', '/login'));

            // Mode should remain at 0 since subscription was cleaned up
            expect(component.mode).toBe(0);
        });
    });
});
