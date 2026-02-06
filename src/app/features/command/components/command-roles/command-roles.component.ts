import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { AbstractControl, AsyncValidatorFn, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable, of, Subject, timer } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-command-roles',
    templateUrl: './command-roles.component.html',
    styleUrls: ['../command-page/command-page.component.scss', './command-roles.component.scss']
})
export class CommandRolesComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    roleForm: UntypedFormGroup;
    roles: any;

    validationMessages = [
        { type: 'required', message: 'Role is required' },
        { type: 'roleTaken', message: 'That role is already in use' }
    ];

    constructor(formbuilder: UntypedFormBuilder, private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {
        this.roleForm = formbuilder.group({
            name: ['', Validators.required, this.validateRole()]
        });
    }

    ngOnInit() {
        this.httpClient.get(`${this.urls.apiUrl}/roles`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                this.roles = response['roles'];
            }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    validateInlineRole(role): Observable<boolean> {
        return timer(200).pipe(
            switchMap(() => {
                if (role.name === null) {
                    return of(false);
                }
                return this.httpClient.post(`${this.urls.apiUrl}/roles/${role.name}`, role).pipe(map((response) => !!response));
            })
        );
    }

    addRole(type) {
        let formString = JSON.stringify(this.roleForm.getRawValue()).replace(/[\n\r]/g, '');
        this.httpClient
            .put(`${this.urls.apiUrl}/roles`, formString, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.roles = response['roles'];
                    this.roleForm.reset();
                }
            });
    }

    editRole(name) {
        const role = this.roles.find((x) => x.name === name);
        if (role) {
            this.httpClient
                .patch(`${this.urls.apiUrl}/roles`, role, {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json'
                    })
                })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (response) => {
                        this.roles = response['roles'];
                    }
                });
        }
    }

    deleteRole(event, role) {
        event.stopPropagation();
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${role.name}'?` }
        });
        dialog.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
            next: (result) => {
                if (result) {
                    this.httpClient.delete(`${this.urls.apiUrl}/roles/${role.id}`).pipe(takeUntil(this.destroy$)).subscribe({
                        next: (response) => {
                            this.roles = response['roles'];
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
                    return this.httpClient.post(`${this.urls.apiUrl}/roles/${control.value}`, {}).pipe(map((response) => (response ? { roleTaken: true } : null)));
                })
            );
        };
    }

    trackByIndex(index: number): number {
        return index;
    }

    trackByRoleName(index: number, role: any): string {
        return role.name;
    }

    unfocus() {
        if (!this.roleForm.controls['name'].value) {
            this.roleForm.reset();
        }
    }
}
