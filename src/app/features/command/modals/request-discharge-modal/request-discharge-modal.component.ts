import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { InstantErrorStateMatcher } from '@app/Services/formhelper.service';
import { BasicAccount } from '@app/Models/Account';
import { CommandRequest } from '@app/Models/CommandRequest';
import { IDropdownElement, mapFromElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-request-discharge-modal',
    templateUrl: './request-discharge-modal.component.html',
    styleUrls: ['./request-discharge-modal.component.scss', '../../components/command-page/command-page.component.scss']
})
export class RequestDischargeModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    model: FormModel = {
        account: null,
        reason: null
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A discharge reason is required' }]
    };

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urlService: UrlService) {}

    ngOnInit(): void {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/members?reverse=true`).subscribe({
            next: (accounts: BasicAccount[]) => {
                this.accounts.next(accounts.map(BasicAccount.mapToElement));
                this.accounts.complete();
            }
        });
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        const commandRequest: CommandRequest = {
            recipient: mapFromElement(BasicAccount, this.model.account).id,
            reason: this.model.reason
        };

        this.pending = true;
        this.httpClient
            .post(`${this.urlService.apiUrl}/commandrequests/create/discharge`, commandRequest, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
            .subscribe({
                next: () => {
                    this.dialog.closeAll();
                    this.pending = false;
                },
                error: (error) => {
                    this.dialog.closeAll();
                    this.pending = false;
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                }
            });
    }

    getAccountName(element: IDropdownElement): string {
        return mapFromElement(BasicAccount, element).displayName;
    }
}

interface FormModel {
    account: IDropdownElement;
    reason: string;
}
