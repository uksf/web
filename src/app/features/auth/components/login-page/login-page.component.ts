import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Event, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CentreWrapperComponent } from '../../../../shared/components/elements/centre-wrapper/centre-wrapper.component';
import { MatCard } from '@angular/material/card';
import { LoginComponent } from '../login/login.component';
import { RequestPasswordResetComponent } from '../request-password-reset/request-password-reset.component';
import { PasswordResetComponent } from '../reset-password/password-reset.component';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
    imports: [CentreWrapperComponent, MatCard, LoginComponent, RequestPasswordResetComponent, PasswordResetComponent]
})
export class LoginPageComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    private destroyed = new Subject<void>();
    resetPasswordCode: string;
    mode = 0;

    ngOnInit() {
        this.checkReset();

        this.router.events
            .pipe(
                filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
                takeUntil(this.destroyed)
            )
            .subscribe({
                next: () => {
                    this.checkReset();
                }
            });
    }

    ngOnDestroy(): void {
        this.destroyed.next(null);
        this.destroyed.complete();
    }

    checkReset() {
        const params = this.route.snapshot.queryParams;

        if (params['reset']) {
            this.resetPasswordCode = params['reset'];
            this.setMode(2);
        } else {
            this.setMode(0);
        }
    }

    setMode(mode: number) {
        this.mode = mode;
    }
}
