import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AuthHttpInterceptor } from './auth-http-interceptor';
import { PermissionsService } from '../permissions.service';
import { RedirectService } from './redirect.service';
import { UksfError } from '@app/shared/models/response';

describe('AuthHttpInterceptor', () => {
    let interceptor: AuthHttpInterceptor;
    let mockRouter: any;
    let mockActivatedRoute: any;
    let mockDialog: any;
    let mockNext: any;
    let mockPermissionsService: any;
    let mockRedirectService: any;

    const dummyRequest = new HttpRequest<unknown>('GET', '/api/test');

    beforeEach(() => {
        mockRouter = {
            url: '/admin',
            navigate: vi.fn().mockResolvedValue(true)
        };
        mockActivatedRoute = {};
        mockPermissionsService = { revoke: vi.fn() };
        mockRedirectService = { setRedirectUrl: vi.fn() };
        mockDialog = { open: vi.fn() };
        mockNext = {
            handle: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                AuthHttpInterceptor,
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: MatDialog, useValue: mockDialog },
                { provide: PermissionsService, useValue: mockPermissionsService },
                { provide: RedirectService, useValue: mockRedirectService },
            ]
        });
        interceptor = TestBed.inject(AuthHttpInterceptor);
    });

    it('passes through successful responses', () => {
        const response = new HttpResponse({ status: 200 });
        mockNext.handle.mockReturnValue(of(response));

        let result: any;
        interceptor.intercept(dummyRequest, mockNext).subscribe({
            next: (value) => { result = value; }
        });

        expect(result).toBe(response);
    });

    it('returns UksfError for network errors (status 0)', () => {
        const networkError = new HttpErrorResponse({ status: 0, error: { type: 'error' } });
        mockNext.handle.mockReturnValue(throwError(() => networkError));

        let receivedError: UksfError | undefined;
        interceptor.intercept(dummyRequest, mockNext).subscribe({
            error: (err) => { receivedError = err; }
        });

        expect(receivedError).toBeDefined();
        expect(receivedError!.statusCode).toBe(0);
        expect(receivedError!.error).toContain('Network error');
        expect(mockPermissionsService.revoke).not.toHaveBeenCalled();
    });

    it('saves redirect URL and revokes on 401', () => {
        const error401 = new HttpErrorResponse({ status: 401 });
        mockNext.handle.mockReturnValue(throwError(() => error401));

        let completed = false;
        let errored = false;
        interceptor.intercept(dummyRequest, mockNext).subscribe({
            complete: () => { completed = true; },
            error: () => { errored = true; }
        });

        expect(mockRedirectService.setRedirectUrl).toHaveBeenCalledWith('/admin');
        expect(mockPermissionsService.revoke).toHaveBeenCalled();
        expect(completed).toBe(true);
        expect(errored).toBe(false);
    });

    it('navigates back and shows modal on 403', () => {
        const error403 = new HttpErrorResponse({ status: 403 });
        mockNext.handle.mockReturnValue(throwError(() => error403));

        let completed = false;
        interceptor.intercept(dummyRequest, mockNext).subscribe({
            complete: () => { completed = true; }
        });

        expect(mockRouter.navigate).toHaveBeenCalledWith(['..'], { relativeTo: mockActivatedRoute });
        expect(completed).toBe(true);
    });

    it('extracts UksfError body from error responses', () => {
        const uksfBody: UksfError = { error: 'Bad request', statusCode: 400, detailCode: 1, validation: { reports: [] } };
        const error400 = new HttpErrorResponse({ status: 400, error: uksfBody });
        mockNext.handle.mockReturnValue(throwError(() => error400));

        let receivedError: UksfError | undefined;
        interceptor.intercept(dummyRequest, mockNext).subscribe({
            error: (err) => { receivedError = err; }
        });

        expect(receivedError).toBe(uksfBody);
    });

    it('creates synthetic UksfError for non-standard error bodies', () => {
        const error500 = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
        mockNext.handle.mockReturnValue(throwError(() => error500));

        let receivedError: UksfError | undefined;
        interceptor.intercept(dummyRequest, mockNext).subscribe({
            error: (err) => { receivedError = err; }
        });

        expect(receivedError).toBeDefined();
        expect(receivedError!.statusCode).toBe(500);
    });

    it('does not revoke on non-auth errors', () => {
        const error400 = new HttpErrorResponse({ status: 400, error: { statusCode: 400, error: 'Bad', detailCode: 0, validation: { reports: [] } } });
        mockNext.handle.mockReturnValue(throwError(() => error400));

        interceptor.intercept(dummyRequest, mockNext).subscribe({ error: () => {} });

        expect(mockPermissionsService.revoke).not.toHaveBeenCalled();
    });
});
