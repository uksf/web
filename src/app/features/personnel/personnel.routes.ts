import { Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { loginRedirect } from '@app/login-redirect';
import { PersonnelPageComponent } from './components/personnel-page/personnel-page.component';
import { PersonnelLoasComponent } from './components/personnel-loas/personnel-loas.component';
import { PersonnelActivityComponent } from './components/personnel-activity/personnel-activity.component';
import { PersonnelDischargesComponent } from './components/personnel-discharges/personnel-discharges.component';
import { PersonnelRosterComponent } from './components/personnel-roster/personnel-roster.component';
import { DischargesService } from './services/discharges.service';

const memberPermissions = {
    only: Permissions.MEMBER,
    except: Permissions.UNLOGGED,
    redirectTo: {
        MEMBER: '/home',
        UNLOGGED: loginRedirect,
        default: '/home'
    }
};

const dischargesPermissions = {
    only: Permissions.DISCHARGES,
    except: Permissions.UNLOGGED,
    redirectTo: {
        DISCHARGES: '/home',
        UNLOGGED: loginRedirect,
        default: '/home'
    }
};

export const PERSONNEL_ROUTES: Routes = [
    {
        path: '',
        component: PersonnelPageComponent,
        providers: [DischargesService],
        children: [
            {
                path: '',
                redirectTo: 'loas',
                pathMatch: 'full'
            },
            {
                path: 'loas',
                component: PersonnelLoasComponent,
                data: { permissions: memberPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'activity',
                component: PersonnelActivityComponent,
                data: { permissions: memberPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'discharges',
                component: PersonnelDischargesComponent,
                data: { permissions: dischargesPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'discharges/:filter',
                component: PersonnelDischargesComponent,
                data: { permissions: dischargesPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'roster',
                component: PersonnelRosterComponent,
                data: {
                    permissions: {
                        except: Permissions.UNLOGGED,
                        redirectTo: {
                            UNLOGGED: loginRedirect,
                            default: '/home'
                        }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            }
        ]
    }
];
