import { Injectable, Injector } from '@angular/core';
import { Location } from '@angular/common';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PermissionsService } from '../permissions.service';
import { ErrorResponse } from '../../Models/Response';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from '../../Modals/message-modal/message-modal.component';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
    constructor(private router: Router, private location: Location, private injector: Injector, private dialog: MatDialog) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((errorResponse: ErrorResponse) => {
                if (errorResponse.error.statusCode === 401) {
                    const permissionsService = this.injector.get(PermissionsService);
                    permissionsService.revoke(this.router.url);
                    return;
                } else if (errorResponse.error.statusCode === 403) {
                    this.dialog
                        .open(MessageModalComponent, {
                            data: { message: 'You do not have the permissions needed to view this page' }
                        })
                        .afterClosed()
                        .subscribe(() => {
                            this.location.back();
                        });
                    return;
                }

                return throwError(() => errorResponse.error);
            })
        );
    }
}
