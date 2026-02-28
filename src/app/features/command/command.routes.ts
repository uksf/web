import { Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { loginRedirect } from '@app/login-redirect';
import { CommandPageComponent } from './components/command-page/command-page.component';
import { CommandRequestsComponent } from './components/command-requests/command-requests.component';
import { CommandMembersComponent } from './components/command-members/command-members.component';
import { CommandUnitsComponent } from './components/command-units/command-units.component';
import { CommandRanksComponent } from './components/command-ranks/command-ranks.component';
import { CommandRolesComponent } from './components/command-roles/command-roles.component';
import { CommandTrainingComponent } from './components/command-training/command-training.component';
import { RolesService } from './services/roles.service';
import { TrainingsService } from './services/trainings.service';

const commandPermissions = {
    only: Permissions.COMMAND,
    except: Permissions.UNLOGGED,
    redirectTo: {
        COMMAND: '/home',
        UNLOGGED: loginRedirect,
        default: '/home'
    }
};

export const COMMAND_ROUTES: Routes = [
    {
        path: '',
        component: CommandPageComponent,
        providers: [RolesService, TrainingsService],
        children: [
            { path: '', redirectTo: 'requests', pathMatch: 'full' },
            {
                path: 'requests',
                component: CommandRequestsComponent,
                data: { permissions: commandPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'members',
                component: CommandMembersComponent,
                data: { permissions: commandPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'units',
                component: CommandUnitsComponent,
                data: { permissions: commandPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'ranks',
                component: CommandRanksComponent,
                data: { permissions: commandPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'roles',
                component: CommandRolesComponent,
                data: { permissions: commandPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'training',
                component: CommandTrainingComponent,
                data: { permissions: commandPermissions },
                canActivate: [NgxPermissionsGuard]
            }
        ]
    }
];
