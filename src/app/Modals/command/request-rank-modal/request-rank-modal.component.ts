import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { InstantErrorStateMatcher } from '../../../Services/formhelper.service';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../../Components/elements/dropdown/dropdown.component';
import { BasicAccount } from '../../../Models/Account';
import { CommandRequest } from '../../../Models/CommandRequest';
import { Rank } from '../../../Models/Rank';

@Component({
    selector: 'app-request-rank-modal',
    templateUrl: './request-rank-modal.component.html',
    styleUrls: ['./request-rank-modal.component.scss', '../../../Pages/command-page/command-page.component.scss'],
})
export class RequestRankModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    model: FormModel = {
        account: null,
        rank: null,
        reason: null,
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    ranks: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the promotion/demotion is required' }],
    };

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urlService: UrlService) {}

    ngOnInit() {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/under`).subscribe({
            next: (accounts: BasicAccount[]) => {
                this.accounts.next(accounts.map(BasicAccount.mapToElement));
                this.accounts.complete();
            },
        });

        this.ranks.next([]);
    }

    onSelectAccount(element: IDropdownElement) {
        if (element === null) {
            this.ranks.next([]);
            return;
        }

        this.httpClient.get(`${this.urlService.apiUrl}/ranks/${mapFromElement(BasicAccount, element).id}`).subscribe({
            next: (ranks: Rank[]) => {
                this.ranks.next(ranks.map(Rank.mapToElement).reverse());
            },
        });
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        const commandRequest: CommandRequest = {
            recipient: mapFromElement(BasicAccount, this.model.account).id,
            value: mapFromElement(Rank, this.model.rank).name,
            reason: this.model.reason,
        };

        this.pending = true;
        this.httpClient
            .put(`${this.urlService.apiUrl}/commandrequests/create/rank`, commandRequest, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
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
                        data: { message: error.error },
                    });
                },
            });
    }

    getAccountName(element: IDropdownElement): string {
        return mapFromElement(BasicAccount, element).displayName;
    }

    getRankName(element: IDropdownElement): string {
        return mapFromElement(Rank, element).name;
    }
}

interface FormModel {
    account: IDropdownElement;
    rank: IDropdownElement;
    reason: string;
}
