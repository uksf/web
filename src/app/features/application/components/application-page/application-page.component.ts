import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { AccountService } from '@app/core/services/account.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { MembershipState } from '@app/shared/models/account';
import { ApplicationState } from '@app/features/application/models/application';
import { ApplicationService } from '../../services/application.service';

@Component({
    selector: 'app-application-page',
    templateUrl: './application-page.component.html',
    styleUrls: ['./application-page.component.scss']
})
export class ApplicationPageComponent implements OnInit {
    step = 1;

    constructor(private applicationService: ApplicationService, public dialog: MatDialog, private accountService: AccountService) {}

    ngOnInit() {
        this.checkStep();
    }

    checkStep() {
        if (this.accountService.account) {
            if (this.accountService.account.application && this.accountService.account.application.state !== ApplicationState.WAITING) {
                this.step = 6;
            } else if (this.accountService.account.membershipState === MembershipState.UNCONFIRMED) {
                this.step = 3;
            } else if (this.accountService.account.membershipState === MembershipState.CONFIRMED && !this.connected()) {
                this.step = 4;
            } else if (this.connected() && !this.submitted()) {
                this.step = 5;
            } else {
                this.step = 6;
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
            this.step++;
            this.checkStep();
        }, 1);
    }

    submit(details: string) {
        this.applicationService.submitApplication(this.accountService.account.id, details)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.accountService.getAccount()?.pipe(first()).subscribe({
                        next: () => {
                            this.step = 6;
                        }
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
