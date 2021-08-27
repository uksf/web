import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../../Components/elements/dropdown-base/dropdown-base.component';
import { BasicAccount } from '../../../Models/Account';
import { Rank } from '../../../Models/Rank';
import { SelectionListComponent } from '../../../Components/elements/selection-list/selection-list.component';
import { RequestModalData } from '../../../Models/Shared';
import { CommandRequest } from '../../../Models/CommandRequest';
import { MessageModalComponent } from '../../message-modal/message-modal.component';

@Component({
    selector: 'app-request-rank-modal',
    templateUrl: './request-rank-modal.component.html',
    styleUrls: ['./request-rank-modal.component.scss', '../../../Pages/command-page/command-page.component.scss']
})
export class RequestRankModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    @ViewChild('accountList', { read: SelectionListComponent }) accountList: SelectionListComponent;
    pending: boolean = false;
    preSelection: string[] = [];
    model: FormModel = {
        accounts: [],
        rank: null,
        reason: null
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    ranks: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the promotion/demotion is required' }]
    };

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urlService: UrlService, @Inject(MAT_DIALOG_DATA) public data: RequestModalData) {
        if (data) {
            this.preSelection = data.ids;
        }
    }

    ngOnInit() {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/under`).subscribe({
            next: (accounts: BasicAccount[]) => {
                const elements = accounts.map(BasicAccount.mapToElement);
                this.accounts.next(elements);
                this.accounts.complete();

                if (this.preSelection.length > 0) {
                    this.model.accounts = elements.filter((element: IDropdownElement) => this.preSelection.includes(element.value));
                }
            }
        });

        this.httpClient.get(`${this.urlService.apiUrl}/ranks`).subscribe({
            next: (ranks: Rank[]) => {
                this.ranks.next(ranks.map(Rank.mapToElement).reverse());
            }
        });
    }

    onSelectAccount() {
        this.checkAccountRanks();
    }

    onSelectRank() {
        this.checkAccountRanks();
    }

    checkAccountRanks() {
        this.model.accounts.forEach((element: IDropdownElement) => {
            if (this.model.rank === null) {
                element.disabled = false;
                return;
            }

            const rankAbbreviation = element.displayValue.split('.')[0];
            element.disabled = rankAbbreviation === this.model.rank.data;
        });
        this.revalidate();
    }

    revalidate() {
        this.accountList.revalidate();
        this.form.form.get('formAccountList').updateValueAndValidity();
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        this.model.accounts.forEach((element: IDropdownElement) => {
            const commandRequest: CommandRequest = {
                recipient: mapFromElement(BasicAccount, element).id,
                value: mapFromElement(Rank, this.model.rank).name,
                reason: this.model.reason
            };

            this.pending = true;
            this.httpClient
                .put(`${this.urlService.apiUrl}/commandrequests/create/rank`, commandRequest, {
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
        });
    }

    getAccountName(element: IDropdownElement): string {
        return mapFromElement(BasicAccount, element).displayName;
    }

    getRankName(element: IDropdownElement): string {
        return mapFromElement(Rank, element).name;
    }

    getAccountTooltip = (element: IDropdownElement): string => {
        if (this.model.rank === null) {
            return '';
        }

        return `${this.getAccountName(element)} is already a ${this.getRankName(this.model.rank)}`;
    };
}

interface FormModel {
    accounts: IDropdownElement[];
    rank: IDropdownElement;
    reason: string;
}
