import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Role } from '@app/shared/models/role';
import { RolesService } from '../../services/roles.service';

@Component({
    selector: 'app-command-roles',
    templateUrl: './command-roles.component.html',
    styleUrls: ['../command-page/command-page.component.scss', './command-roles.component.scss'],
    standalone: false
})
export class CommandRolesComponent implements OnInit {
    roleForm = this.formBuilder.group({
        name: ['', Validators.required, this.validateRole()]
    });
    roles: Role[];

    validationMessages = [
        { type: 'required', message: 'Role is required' },
        { type: 'roleTaken', message: 'That role is already in use' }
    ];

    constructor(private formBuilder: FormBuilder, private rolesService: RolesService, private dialog: MatDialog) {}

    ngOnInit() {
        this.rolesService.getRoles().pipe(first()).subscribe({
            next: (response) => {
                this.roles = response.roles;
            }
        });
    }

    validateInlineRole(role): Observable<boolean> {
        return timer(200).pipe(
            switchMap(() => {
                if (role.name === null) {
                    return of(false);
                }
                return this.rolesService.checkRoleName(role.name, role).pipe(map((response) => !!response));
            })
        );
    }

    addRole() {
        let formString = JSON.stringify(this.roleForm.getRawValue()).replace(/[\n\r]/g, '');
        this.rolesService.addRole(formString).pipe(first()).subscribe({
            next: (response) => {
                this.roles = response.roles;
                this.roleForm.reset();
            }
        });
    }

    editRole(name) {
        const role = this.roles.find((x) => x.name === name);
        if (role) {
            this.rolesService.editRole(role).pipe(first()).subscribe({
                next: (response) => {
                    this.roles = response.roles;
                }
            });
        }
    }

    deleteRole(event, role) {
        event.stopPropagation();
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${role.name}'?` }
        });
        dialog.afterClosed().pipe(first()).subscribe({
            next: (result) => {
                if (result) {
                    this.rolesService.deleteRole(role.id).pipe(first()).subscribe({
                        next: (response) => {
                            this.roles = response.roles;
                        }
                    });
                }
            }
        });
    }

    private validateRole(): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors> => {
            return timer(200).pipe(
                switchMap(() => {
                    if (control.pristine || !control.value) {
                        return of(null);
                    }
                    return this.rolesService.checkRoleName(control.value).pipe(map((response) => (response ? { roleTaken: true } : null)));
                })
            );
        };
    }

    trackByRoleName(index: number, role: Role): string {
        return role.name;
    }

    unfocus() {
        if (!this.roleForm.controls.name.value) {
            this.roleForm.reset();
        }
    }
}
