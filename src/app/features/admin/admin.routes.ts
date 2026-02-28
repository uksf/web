import { Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { loginRedirect } from '@app/login-redirect';

import { AdminLogsComponent } from './components/admin-logs/admin-logs.component';
import { AdminErrorLogsComponent } from './components/admin-error-logs/admin-error-logs.component';
import { AdminAuditLogsComponent } from './components/admin-audit-logs/admin-audit-logs.component';
import { AdminDiscordLogsComponent } from './components/admin-discord-logs/admin-discord-logs.component';
import { AdminLauncherLogsComponent } from './components/admin-launcher-logs/admin-launcher-logs.component';
import { AdminToolsComponent } from './components/admin-tools/admin-tools.component';
import { AdminVariablesComponent } from './components/admin-variables/admin-variables.component';
import { AdminServersComponent } from './components/admin-servers/admin-servers.component';
import { AdminToolsService } from './services/admin-tools.service';
import { InfrastructureService } from './services/infrastructure.service';
import { LogsService } from './services/logs.service';
import { VariablesService } from './services/variables.service';

const adminPermissions = {
    only: Permissions.ADMIN,
    except: Permissions.UNLOGGED,
    redirectTo: {
        ADMIN: '/home',
        UNLOGGED: loginRedirect,
        default: '/home'
    }
};

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        providers: [AdminToolsService, InfrastructureService, LogsService, VariablesService],
        children: [
            {
                path: '',
                redirectTo: 'audit',
                pathMatch: 'full'
            },
            {
                path: 'logs',
                component: AdminLogsComponent,
                data: { permissions: adminPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'errors',
                component: AdminErrorLogsComponent,
                data: { permissions: adminPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'audit',
                component: AdminAuditLogsComponent,
                data: { permissions: adminPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'discord',
                component: AdminDiscordLogsComponent,
                data: { permissions: adminPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'launcher',
                component: AdminLauncherLogsComponent,
                data: { permissions: adminPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'tools',
                component: AdminToolsComponent,
                data: { permissions: adminPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'variables',
                component: AdminVariablesComponent,
                data: { permissions: adminPermissions },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'servers',
                component: AdminServersComponent,
                data: { permissions: adminPermissions },
                canActivate: [NgxPermissionsGuard]
            }
        ]
    }
];
