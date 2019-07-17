import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { HttpInterceptor, HttpRequest, HttpErrorResponse, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
    constructor(private auth: AuthenticationService, private router: Router, private location: Location) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(tap(() => { }, error => {
            if (error instanceof HttpErrorResponse) {
                if (error.status === 401) {
                    this.auth.logout(this.router.url);
                } else if (error.status === 403) {
                    this.location.back();
                }
            }
        }));
    }
}
