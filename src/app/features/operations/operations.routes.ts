import { Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { loginRedirect } from '@app/login-redirect';
import { OperationsPageComponent } from './components/operations-page/operations-page.component';
import { OperationsServersComponent } from './components/operations-servers/operations-servers.component';
import { OperationsAarComponent } from './components/operations-aar/operations-aar.component';
import { GameServersService } from './services/game-servers.service';

export const OPERATIONS_ROUTES: Routes = [
    {
        path: '',
        component: OperationsPageComponent,
        providers: [GameServersService],
        children: [
            {
                path: '',
                redirectTo: 'servers',
                pathMatch: 'full'
            },
            { path: 'activity', redirectTo: 'aar' },
            { path: 'orders', redirectTo: 'aar' },
            { path: 'reports', redirectTo: 'aar' },
            { path: 'opords', redirectTo: 'aar' },
            { path: 'opreps', redirectTo: 'aar' },
            {
                path: 'servers',
                component: OperationsServersComponent,
                data: {
                    permissions: {
                        only: Permissions.SERVERS,
                        except: Permissions.UNLOGGED,
                        redirectTo: {
                            UNLOGGED: loginRedirect,
                            default: '/operations/aar'
                        }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'aar',
                component: OperationsAarComponent,
                data: {
                    permissions: {
                        only: Permissions.MEMBER,
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
