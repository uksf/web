import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, ValidationErrors, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Role } from '@app/shared/models/role';
import { RolesService } from '../../services/roles.service';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgxPermissionsModule } from 'ngx-permissions';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { InlineEditComponent } from '../../../../shared/components/elements/inline-edit/inline-edit.component';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ReactiveFormValueDebugComponent } from '../../../../shared/components/elements/form-value-debug/form-value-debug.component';

@Component({
    selector: 'app-command-roles',
    templateUrl: './command-roles.component.html',
    styleUrls: ['../command-page/command-page.component.scss', './command-roles.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        MatProgressSpinner,
        NgxPermissionsModule,
        FormsModule,
        ReactiveFormsModule,
        TextInputComponent,
        MatButton,
        MatCard,
        InlineEditComponent,
        FlexFillerComponent,
        MatIcon,
        MatTooltip,
        ReactiveFormValueDebugComponent
    ]
})
export class CommandRolesComponent implements OnInit {
    private formBuilder = inject(FormBuilder);
    private rolesService = inject(RolesService);
    private dialog = inject(MatDialog);

    roleForm = this.formBuilder.group({
        name: ['', Validators.required, this.validateRole()]
    });
    roles: Role[];

    validationMessages = [
        { type: 'required', message: 'Role is required' },
        { type: 'roleTaken', message: 'That role is already in use' }
    ];

    ngOnInit() {
        this.rolesService
            .getRoles()
            .pipe(first())
            .subscribe({
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
        const formString = JSON.stringify(this.roleForm.getRawValue()).replace(/[\n\r]/g, '');
        this.rolesService
            .addRole(formString)
            .pipe(first())
            .subscribe({
                next: (response) => {
                    this.roles = response.roles;
                    this.roleForm.reset();
                }
            });
    }

    editRole(name) {
        const role = this.roles.find((x) => x.name === name);
        if (role) {
            this.rolesService
                .editRole(role)
                .pipe(first())
                .subscribe({
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
        dialog
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.rolesService
                            .deleteRole(role.id)
                            .pipe(first())
                            .subscribe({
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

    trackByRoleId(index: number, role: Role): string {
        return role.id;
    }

    unfocus() {
        if (!this.roleForm.controls.name.value) {
            this.roleForm.reset();
        }
    }
}
