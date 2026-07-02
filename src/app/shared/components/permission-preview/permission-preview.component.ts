import { Component, inject } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { MatIcon } from '@angular/material/icon';
import { Permissions } from '@app/core/services/permissions';

@Component({
    selector: 'app-permission-preview',
    templateUrl: './permission-preview.component.html',
    styleUrls: ['./permission-preview.component.scss'],
    imports: [MatIcon]
})
export class PermissionPreviewComponent {
    private ngxPermissions = inject(NgxPermissionsService);

    readonly roles = [
        Permissions.MEMBER,
        Permissions.NCO,
        Permissions.RECRUITER,
        Permissions.PERSONNEL,
        Permissions.SERVERS,
        Permissions.COMMAND,
        Permissions.ADMIN,
        Permissions.TESTER
    ];

    open = false;
    readonly active = new Set<string>();
    private original: string[] = [];

    constructor() {
        this.original = Object.keys(this.ngxPermissions.getPermissions());
    }

    toggleOpen() {
        this.open = !this.open;
    }

    isActive(role: string): boolean {
        return this.active.has(role);
    }

    toggle(role: string) {
        if (this.active.has(role)) {
            this.active.delete(role);
        } else {
            this.active.add(role);
        }
        this.apply();
    }

    reset() {
        this.active.clear();
        this.ngxPermissions.flushPermissions();
        this.ngxPermissions.addPermission(this.original);
    }

    private apply() {
        if (this.active.size === 0) {
            this.reset();
            return;
        }

        const effective = new Set<string>([Permissions.MEMBER]);
        const lookup = Permissions.LookUp();
        this.active.forEach((role) => (lookup[role] ?? [role]).forEach((permission) => effective.add(permission)));

        this.ngxPermissions.flushPermissions();
        this.ngxPermissions.addPermission([...effective]);
    }
}
