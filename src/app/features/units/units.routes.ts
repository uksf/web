import { Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { loginRedirect } from '@app/login-redirect';
import { UnitsPageComponent } from './components/units-page/units-page.component';
import { UnitsOrbatComponent } from './components/units-orbat/units-orbat.component';
import { UnitsOrbatAuxComponent } from './components/units-orbat-aux/units-orbat-aux.component';
import { UnitsOrbatSecondaryComponent } from './components/units-orbat-secondary/units-orbat-secondary.component';
import { UnitPageComponent } from './components/unit-page/unit-page.component';

const unitsPermissions = {
    except: Permissions.UNLOGGED,
    redirectTo: {
        UNLOGGED: loginRedirect,
        default: '/home'
    }
};

export const UNITS_ROUTES: Routes = [
    {
        path: '',
        component: UnitsPageComponent,
        children: [
            { path: '', redirectTo: 'orbat', pathMatch: 'full' },
            {
                path: 'orbat',
                component: UnitsOrbatComponent,
                data: { permissions: unitsPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'auxiliary',
                component: UnitsOrbatAuxComponent,
                data: { permissions: unitsPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'secondary',
                component: UnitsOrbatSecondaryComponent,
                data: { permissions: unitsPermissions },
                canActivate: [NgxPermissionsGuard]
            }
        ]
    },
    {
        path: ':id',
        component: UnitPageComponent,
        data: { permissions: unitsPermissions },
        canActivate: [NgxPermissionsGuard]
    }
];
