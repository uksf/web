import { Injectable, Injector } from '@angular/core';
import { Location } from '@angular/common';
import { HttpInterceptor, HttpRequest, HttpErrorResponse, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PermissionsService } from '../permissions.service';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
    constructor(private router: Router, private location: Location, private injector: Injector) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            tap(
                () => {},
                (error) => {
                    if (error instanceof HttpErrorResponse) {
                        if (error.status === 401) {
                            const permissionsService = this.injector.get(PermissionsService);
                            permissionsService.revoke(this.router.url);
                        } else if (error.status === 403) {
                            this.location.back();
                        }
                    }
                }
            )
        );
    }
}
