import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { Observable, timer, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { UntypedFormGroup, UntypedFormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/Services/formhelper.service';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { VariableItem } from '@app/Models/VariableItem';

@Component({
    selector: 'app-admin-variables',
    templateUrl: './admin-variables.component.html',
    styleUrls: ['../admin-page/admin-page.component.scss', './admin-variables.component.scss']
})
export class AdminVariablesComponent implements OnInit {
    @ViewChild(MatAccordion) accordion: MatAccordion;
    expanded = false;
    form: UntypedFormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    updating;
    variables: VariableItem[];
    variableLists: VariableItemList[];

    validationMessages = {
        key: [
            { type: 'required', message: 'Key is required' },
            { type: 'keyTaken', message: 'That key is already in use' }
        ],
        item: [{ type: 'required', message: 'Item is required' }]
    };

    constructor(formbuilder: UntypedFormBuilder, private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {
        this.form = formbuilder.group({
            key: ['', Validators.required, this.validateVariable.bind(this)],
            item: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.getVariables();
    }

    trackByVariableList(_: number, variableList: VariableItemList) {
        return variableList.name;
    }

    trackByVariableItem(_: number, variableItem: VariableItem) {
        return variableItem.key;
    }

    formatVariables() {
        this.variableLists = [];
        this.variables.forEach((variableItem: VariableItem) => {
            const parts = variableItem.key.split('_');
            const index = this.variableLists.findIndex((x) => x.name === parts[0]);
            if (index === -1) {
                this.variableLists.push({ name: parts[0], items: [variableItem] });
            } else {
                const variableList = this.variableLists[index];
                variableList.items.push(variableItem);
            }
        });
    }

    getVariables() {
        this.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/variables`).subscribe({
            next: (response: VariableItem[]) => {
                this.variables = response;
                this.formatVariables();
                this.updating = false;
            },
            error: () => {
                this.updating = false;
            }
        });
    }

    addVariable() {
        this.updating = true;
        const formString = JSON.stringify(this.form.getRawValue()).replace(/[\n\r]/g, '');
        this.httpClient
            .put(`${this.urls.apiUrl}/variables`, formString, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
            .subscribe({
                next: () => {
                    this.form.controls.key.reset();
                    this.form.controls.item.reset();
                    this.getVariables();
                },
                error: () => {
                    this.updating = false;
                }
            });
    }

    validateVariable(control: AbstractControl): Observable<ValidationErrors> {
        return timer(200).pipe(
            switchMap(() => {
                if (control.pristine || !control.value) {
                    return of(null);
                }
                return this.httpClient.post(`${this.urls.apiUrl}/variables/${control.value}`, {}).pipe(map((response) => (response ? { keyTaken: true } : null)));
            })
        );
    }

    editVariable(variable: VariableItem) {
        this.updating = true;
        this.httpClient
            .patch(`${this.urls.apiUrl}/variables`, variable, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
            .subscribe({
                next: () => {
                    this.getVariables();
                },
                error: () => {
                    this.updating = false;
                }
            });
    }

    deleteVariable(event, variable: VariableItem) {
        event.stopPropagation();
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${variable.key}'? This action could break functionality` }
        });
        dialog.afterClosed().subscribe({
            next: (result) => {
                if (result) {
                    this.updating = true;
                    this.httpClient.delete(`${this.urls.apiUrl}/variables/${variable.key}`).subscribe({
                        next: () => {
                            this.getVariables();
                        },
                        error: () => {
                            this.updating = false;
                        }
                    });
                }
            }
        });
    }
}

interface VariableItemList {
    name: string;
    items: VariableItem[];
}
