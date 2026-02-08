import { Injectable, Injector } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionsService } from '../permissions.service';
import { UksfError } from '@app/shared/models/response';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { RedirectService } from './redirect.service';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
    constructor(private router: Router, private activatedRoute: ActivatedRoute, private injector: Injector, private dialog: MatDialog) {}

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(request).pipe(
            catchError((httpError: HttpErrorResponse) => {
                if (httpError.status === 0) {
                    const uksfError: UksfError = {
                        error: 'Network error — unable to reach the server',
                        statusCode: 0,
                        detailCode: 0,
                        validation: { reports: [] }
                    };
                    return throwError(() => uksfError);
                }

                if (httpError.status === 401) {
                    const redirectService = this.injector.get(RedirectService);
                    redirectService.setRedirectUrl(this.router.url);
                    const permissionsService = this.injector.get(PermissionsService);
                    permissionsService.revoke();
                    return EMPTY;
                }

                if (httpError.status === 403) {
                    this.router.navigate(['..'], { relativeTo: this.activatedRoute }).then(() => {
                        this.dialog.open(MessageModalComponent, {
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
    }
}
