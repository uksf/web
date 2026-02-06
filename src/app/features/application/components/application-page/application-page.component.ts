import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { AccountService } from '@app/core/services/account.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { MembershipState } from '@app/shared/models/account';
import { ApplicationState } from '@app/features/application/models/application';

@Component({
    selector: 'app-application-page',
    templateUrl: './application-page.component.html',
    styleUrls: ['./application-page.component.scss']
})
export class ApplicationPageComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    step = 1;
    details: any;

    constructor(private httpClient: HttpClient, private urls: UrlService, public dialog: MatDialog, private accountService: AccountService) {}

    ngOnInit() {
        this.checkStep();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    checkStep() {
        if (this.accountService.account) {
            // Application completed
            if (this.accountService.account.application && this.accountService.account.application.state !== ApplicationState.WAITING) {
                this.step = 7;
            } else if (this.accountService.account.membershipState === MembershipState.UNCONFIRMED) {
                // Needs to confirm email
                this.step = 3;
            } else if (this.accountService.account.membershipState === MembershipState.CONFIRMED && !this.connected()) {
                // Needs to connect communications
                this.step = 4;
            } else if (this.connected() && !this.submitted() && !this.details) {
                // Needs to fill details
                this.step = 5;
            } else if (this.connected() && !this.submitted() && this.details) {
                // Needs to agree and submit
                this.step = 6;
            } else {
                // Submitted
                this.step = 7;
            }
        }
    }

    loggedOut() {
        return this.accountService.account === undefined;
    }

    connected() {
        return (
            this.accountService.account.teamspeakIdentities &&
            this.accountService.account.teamspeakIdentities.length > 0 &&
            this.accountService.account.steamname &&
            this.accountService.account.discordId
        );
    }

    submitted() {
        return this.accountService.account.application && this.accountService.account.application.state === ApplicationState.WAITING;
    }

    previous() {
        setTimeout(() => {
            this.step--;
            this.checkStep();
        }, 1);
    }

    next(event) {
        setTimeout(() => {
            if (this.step === 5) {
                this.details = event;
            }
            this.step++;
            this.checkStep();
        }, 1);
    }

    check() {
        setTimeout(() => {
            this.checkStep();
        }, 1);
    }

    submit() {
        this.httpClient
            .post(`${this.urls.apiUrl}/accounts/${this.accountService.account.id}/application`, this.details, {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' })
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.accountService.getAccount(() => {
                        this.next(null);
                    });
                },
                error: (error) => {
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                }
            });
    }
}
