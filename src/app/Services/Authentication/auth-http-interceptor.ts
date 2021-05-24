import { Injectable, Injector } from '@angular/core';
import { Location } from '@angular/common';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PermissionsService } from '../permissions.service';
import { ErrorResponse } from '../../Models/Response';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
    constructor(private router: Router, private location: Location, private injector: Injector) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((errorResponse: ErrorResponse) => {
                if (errorResponse.error.statusCode === 401) {
                    const permissionsService = this.injector.get(PermissionsService);
                    permissionsService.revoke(this.router.url);
                    return;
                } else if (errorResponse.error.statusCode === 403) {
                    this.location.back();
                    return;
                }

                return throwError(errorResponse.error);
            })
        );
    }
}
