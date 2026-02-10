import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { Observable, timer, of } from 'rxjs';
import { switchMap, map, first } from 'rxjs/operators';
import { FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { VariableItem } from '@app/features/admin/models/variable-item';
import { VariablesService } from '../../services/variables.service';

@Component({
    selector: 'app-admin-variables',
    templateUrl: './admin-variables.component.html',
    styleUrls: ['./admin-variables.component.scss']
})
export class AdminVariablesComponent implements OnInit {
    @ViewChild(MatAccordion) accordion: MatAccordion;
    expanded = false;
    form = this.formBuilder.group({
        key: ['', Validators.required, this.validateVariable.bind(this)],
        item: ['', Validators.required]
    });
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    updating: boolean;
    variables: VariableItem[];
    variableLists: VariableItemList[];

    validationMessages = {
        key: [
            { type: 'required', message: 'Key is required' },
            { type: 'keyTaken', message: 'That key is already in use' }
        ],
        item: [{ type: 'required', message: 'Item is required' }]
    };

    constructor(private formBuilder: FormBuilder, private variablesService: VariablesService, private dialog: MatDialog) {}

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
        this.variablesService.getVariables().pipe(first()).subscribe({
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
        this.variablesService.addVariable(formString).pipe(first()).subscribe({
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
                return this.variablesService.checkVariableKey(control.value).pipe(map((response) => (response ? { keyTaken: true } : null)));
            })
        );
    }

    editVariable(variable: VariableItem) {
        this.updating = true;
        this.variablesService.editVariable(variable).pipe(first()).subscribe({
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
        dialog.afterClosed().pipe(first()).subscribe({
            next: (result) => {
                if (result) {
                    this.updating = true;
                    this.variablesService.deleteVariable(variable.key).pipe(first()).subscribe({
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
