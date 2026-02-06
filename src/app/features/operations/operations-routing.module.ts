import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { OperationsPageComponent } from './components/operations-page/operations-page.component';
import { OperationsServersComponent } from './components/operations-servers/operations-servers.component';
import { OperationsAarComponent } from './components/operations-aar/operations-aar.component';

const loginRedirect = '/login';

const routes: Routes = [
    {
        path: '',
        component: OperationsPageComponent,
        children: [
            {
                path: '',
                redirectTo: 'servers',
                pathMatch: 'full'
            },
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

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OperationsRoutingModule {}
