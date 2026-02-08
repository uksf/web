import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements OnInit, OnDestroy {
    private destroyed = new Subject<void>();
    resetPasswordCode: string;
    mode = 0;

    constructor(private route: ActivatedRoute, private router: Router) {}

    ngOnInit() {
        this.checkReset();

        this.router.events
            .pipe(
                filter((event: RouterEvent) => event instanceof NavigationEnd),
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
