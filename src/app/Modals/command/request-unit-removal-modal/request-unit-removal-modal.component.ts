import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { InstantErrorStateMatcher } from '../../../Services/formhelper.service';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../../Components/elements/dropdown-base/dropdown-base.component';
import { BasicAccount } from '../../../Models/Account';
import { Unit } from '../../../Models/Units';
import { CommandRequest } from '../../../Models/CommandRequest';

@Component({
    selector: 'app-request-unit-removal-modal',
    templateUrl: './request-unit-removal-modal.component.html',
    styleUrls: ['./request-unit-removal-modal.component.scss', '../../../Pages/command-page/command-page.component.scss']
})
export class RequestUnitRemovalModalComponent implements OnInit {
    @ViewChild(NgForm) form!: NgForm;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    model: FormModel = {
        account: null,
        unit: null,
        reason: null
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    units: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        reason: [{ type: 'required', message: () => 'A reason for the unit removal is required' }]
    };

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urlService: UrlService) {}

    ngOnInit() {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/members`).subscribe({
            next: (accounts: BasicAccount[]) => {
                this.accounts.next(accounts.map(BasicAccount.mapToElement));
                this.accounts.complete();
            }
        });

        this.units.next([]);
    }

    onSelectAccount(element: IDropdownElement) {
        if (element === null) {
            this.units.next([]);
            return;
        }

        const accountId = mapFromElement(BasicAccount, element).id;
        
        // Make separate API calls for auxiliary and secondary units since the API only supports one filter at a time
        const auxiliaryRequest = this.httpClient.get<Unit[]>(`${this.urlService.apiUrl}/units?filter=auxiliary&accountId=${accountId}`);
        const secondaryRequest = this.httpClient.get<Unit[]>(`${this.urlService.apiUrl}/units?filter=secondary&accountId=${accountId}`);

        forkJoin([auxiliaryRequest, secondaryRequest]).subscribe({
            next: ([auxiliaryUnits, secondaryUnits]) => {
                // Combine the results from both calls
                const allUnits = [...auxiliaryUnits, ...secondaryUnits];
                this.units.next(allUnits.map(Unit.mapToElement));
            },
            error: (error) => {
                console.error('Error fetching units:', error);
                this.units.next([]);
            }
        });
    }

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        const commandRequest: CommandRequest = {
            recipient: mapFromElement(BasicAccount, this.model.account).id,
            value: mapFromElement(Unit, this.model.unit).id,
            reason: this.model.reason
        };

        this.pending = true;
        this.httpClient.put(this.urlService.apiUrl + '/commandrequests/create/unitremoval', commandRequest).subscribe({
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

    getUnitName(element: IDropdownElement): string {
        return mapFromElement(Unit, element).name;
    }
}

interface FormModel {
    account: IDropdownElement;
    unit: IDropdownElement;
    reason: string;
}
