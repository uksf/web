import { Injectable, Injector } from '@angular/core';
import { Location } from '@angular/common';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionsService } from '../permissions.service';
import { ErrorResponse } from '@app/shared/models/Response';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
    constructor(private router: Router, private activatedRoute: ActivatedRoute, private location: Location, private injector: Injector, private dialog: MatDialog) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((errorResponse: ErrorResponse) => {
                if (errorResponse.error.statusCode === 401) {
                    const permissionsService: PermissionsService = this.injector.get(PermissionsService);
                    permissionsService.revoke(this.router.url);
                    return;
                } else if (errorResponse.error.statusCode === 403) {
                    this.router.navigate(['..'], { relativeTo: this.activatedRoute }).then(() => {
                        this.dialog.open(MessageModalComponent, {
                            data: { message: 'You do not have the permissions needed to view this page' }
                        });
                    });
                    return;
                }

                return throwError(() => errorResponse.error);
            })
        );
    }
}
