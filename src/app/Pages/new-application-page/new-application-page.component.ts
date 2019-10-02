import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from 'app/Services/url.service';
import { AccountService, MembershipState, ApplicationState } from 'app/Services/account.service';
import { Router } from '@angular/router';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-new-application-page',
    templateUrl: './new-application-page.component.html',
    styleUrls: ['./new-application-page.component.scss']
})
export class NewApplicationPageComponent implements OnInit {
    step = 1;
    email;
    details;
    id;

    constructor(
        private httpClient: HttpClient,
        public formBuilder: FormBuilder,
        private urls: UrlService,
        public dialog: MatDialog,
        private accountService: AccountService,
        private router: Router
    ) {
        if (this.accountService.account && this.accountService.account.application && this.accountService.account.application.state !== ApplicationState.WAITING) {
            this.router.navigate(['/recruitment/' + this.accountService.account.id]);
            return;
        }
    }

    ngOnInit() {
        this.checkStep();
    }

    checkStep() {
        if (this.accountService.account) {
            // Needs to confirm email
            if (this.accountService.account.membershipState === MembershipState.UNCONFIRMED) {
                this.email = this.accountService.account.email;
                this.step = 2;
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
        if (this.step === 3) {
            // Needs to login
            this.router.navigate(['/login'], { queryParams: { redirect: 'application' } });
        }
    }

    connected() {
        return this.accountService.account.teamspeakIdentities && this.accountService.account.teamspeakIdentities.length > 0 && this.accountService.account.steamname && this.accountService.account.discordId
    }

    submitted() {
        return this.accountService.account.application && this.accountService.account.application.state === ApplicationState.WAITING;
    }

    next(event) {
        setTimeout(() => {
            if (this.step === 1) {
                this.email = event.email;
            }
            if (this.step === 5) {
                this.details = event;
            }
            this.step++;
            this.checkStep();
        }, 1);
    }

    submit() {
        this.httpClient.post(this.urls.apiUrl + '/applications', this.details, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        }).subscribe(() => {
            this.accountService.getAccount(() => {
                this.next(null);
            });
        }, error => {
            this.dialog.open(MessageModalComponent, {
                data: { message: error.error }
            });
        });
    }
}
