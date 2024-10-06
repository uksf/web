import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { AbstractControl, AsyncValidatorFn, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { InstantErrorStateMatcher } from 'app/Services/formhelper.service';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-command-roles',
    templateUrl: './command-roles.component.html',
    styleUrls: ['../../../Pages/command-page/command-page.component.scss', './command-roles.component.scss']
})
export class CommandRolesComponent implements OnInit {
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    individualForm: UntypedFormGroup;
    unitForm: UntypedFormGroup;
    individualRoles: any;
    unitRoles: any;
    updatingOrder = false;

    validationMessages = [
        { type: 'required', message: 'Role is required' },
        { type: 'roleTaken', message: 'That role is already in use' }
    ];

    constructor(formbuilder: UntypedFormBuilder, private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {
        this.individualForm = formbuilder.group({
            name: ['', Validators.required, this.validateRole(0)],
            roleType: [0]
        });
        this.unitForm = formbuilder.group({
            name: ['', Validators.required, this.validateRole(1)],
            roleType: [1]
        });
    }

    ngOnInit() {
        this.httpClient.get(`${this.urls.apiUrl}/roles`).subscribe((response) => {
            this.individualRoles = response['individualRoles'];
            this.unitRoles = response['unitRoles'];
        });
    }

    validateInlineRole(role, type): Observable<boolean> {
        return timer(200).pipe(
            switchMap(() => {
                if (role.name === null) {
                    return of(false);
                }
                return this.httpClient.post(`${this.urls.apiUrl}/roles/${type}/${role.name}`, role).pipe(map((response) => !!response));
            })
        );
    }

    addRole(type) {
        let formString;
        if (type === 0) {
            formString = JSON.stringify(this.individualForm.getRawValue()).replace(/[\n\r]/g, '');
        } else {
            formString = JSON.stringify(this.unitForm.getRawValue()).replace(/[\n\r]/g, '');
        }
        this.httpClient
            .put(`${this.urls.apiUrl}/roles`, formString, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
            .subscribe((response) => {
                this.individualRoles = response['individualRoles'];
                this.unitRoles = response['unitRoles'];
                if (type === 0) {
                    this.individualForm.reset();
                } else {
                    this.unitForm.reset();
                }
            });
    }

    editRole(name) {
        const role = this.individualRoles.find((x) => x.name === name);
        if (role) {
            this.httpClient
                .patch(`${this.urls.apiUrl}/roles`, role, {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json'
                    })
                })
                .subscribe((response) => {
                    this.individualRoles = response['individualRoles'];
                    this.unitRoles = response['unitRoles'];
                });
        }
    }

    deleteRole(event, role) {
        event.stopPropagation();
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${role.name}'?` }
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.httpClient.delete(`${this.urls.apiUrl}/roles/${role.id}`).subscribe((response) => {
                this.individualRoles = response['individualRoles'];
                this.unitRoles = response['unitRoles'];
            });
        });
    }

    onMove(event: CdkDragDrop<string[]>) {
        const before = JSON.stringify(this.unitRoles);
        moveItemInArray(this.unitRoles, event.previousIndex, event.currentIndex);
        if (before === JSON.stringify(this.unitRoles)) {
            return;
        }
        this.updatingOrder = true;
        this.httpClient.post(`${this.urls.apiUrl}/roles/order`, this.unitRoles).subscribe((response) => {
            this.unitRoles = response;
            this.updatingOrder = false;
        });
    }

    private validateRole(type): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors> => {
            return timer(200).pipe(
                switchMap(() => {
                    if (control.pristine || !control.value) {
                        return of(null);
                    }
                    return this.httpClient.post(`${this.urls.apiUrl}/roles/${type}/${control.value}`, {}).pipe(map((response) => (response ? { roleTaken: true } : null)));
                })
            );
        };
    }

    unfocus() {
        if (!this.individualForm.controls['name'].value) {
            this.individualForm.reset();
        }
        if (!this.unitForm.controls['name'].value) {
            this.unitForm.reset();
        }
    }

    onDragStarted(event) {
        event.source._dragRef._preview.classList.add('dark-theme');
        event.source.element.nativeElement.classList.add('dark-theme');
    }
}
