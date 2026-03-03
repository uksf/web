import { inject, Injector } from '@angular/core';
import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionsService } from '../permissions.service';
import { UksfError } from '@app/shared/models/response';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { RedirectService } from './redirect.service';

export const authHttpInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const injector = inject(Injector);
    const router = inject(Router);
    const activatedRoute = inject(ActivatedRoute);
    const dialog = inject(MatDialog);
    const redirectService = inject(RedirectService);

    return next(req).pipe(
        catchError((httpError: HttpErrorResponse) => {
            if (httpError.status === 0) {
                const uksfError: UksfError = {
                    error: 'Network error - unable to reach the server',
                    statusCode: 0,
                    detailCode: 0,
                    validation: { reports: [] }
                };
                return throwError(() => uksfError);
            }

            if (httpError.status === 401) {
                redirectService.setRedirectUrl(router.url);
                injector.get(PermissionsService).revoke();
                return EMPTY;
            }

            if (httpError.status === 403) {
                router.navigate(['..'], { relativeTo: activatedRoute }).then(() => {
                    dialog.open(MessageModalComponent, {
                        data: { message: 'You do not have the permissions needed to view this page' }
                    });
                });
                return EMPTY;
            }

            const body = httpError.error;
            if (body && typeof body === 'object' && 'statusCode' in body) {
                return throwError(() => body as UksfError);
            }

            const uksfError: UksfError = {
                error: httpError.message || 'Unknown error',
                statusCode: httpError.status,
                detailCode: 0,
                validation: { reports: [] }
            };
            return throwError(() => uksfError);
        })
    );
};
