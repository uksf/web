import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { loginRedirect } from '@app/app-routing.module';
import { CommandPageComponent } from './components/command-page/command-page.component';
import { CommandRequestsComponent } from './components/command-requests/command-requests.component';
import { CommandMembersComponent } from './components/command-members/command-members.component';
import { CommandUnitsComponent } from './components/command-units/command-units.component';
import { CommandRanksComponent } from './components/command-ranks/command-ranks.component';
import { CommandRolesComponent } from './components/command-roles/command-roles.component';
import { CommandTrainingComponent } from './components/command-training/command-training.component';

const routes: Routes = [
    {
        path: '',
        component: CommandPageComponent,
        children: [
            { path: '', redirectTo: 'requests', pathMatch: 'full' },
            {
                path: 'requests',
                component: CommandRequestsComponent,
                data: {
                    permissions: {
                        only: Permissions.COMMAND,
                        except: Permissions.UNLOGGED,
                        redirectTo: {
                            COMMAND: '/home',
                            UNLOGGED: loginRedirect,
                            default: '/home'
                        }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'members',
                component: CommandMembersComponent,
                data: {
                    permissions: {
                        only: Permissions.COMMAND,
                        except: Permissions.UNLOGGED,
                        redirectTo: {
                            COMMAND: '/home',
                            UNLOGGED: loginRedirect,
                            default: '/home'
                        }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'units',
                component: CommandUnitsComponent,
                data: {
                    permissions: {
                        only: Permissions.COMMAND,
                        except: Permissions.UNLOGGED,
                        redirectTo: {
                            COMMAND: '/home',
                            UNLOGGED: loginRedirect,
                            default: '/home'
                        }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'ranks',
                component: CommandRanksComponent,
                data: {
                    permissions: {
                        only: Permissions.COMMAND,
                        except: Permissions.UNLOGGED,
                        redirectTo: {
                            COMMAND: '/home',
                            UNLOGGED: loginRedirect,
                            default: '/home'
                        }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'roles',
                component: CommandRolesComponent,
                data: {
                    permissions: {
                        only: Permissions.COMMAND,
                        except: Permissions.UNLOGGED,
                        redirectTo: {
                            COMMAND: '/home',
                            UNLOGGED: loginRedirect,
                            default: '/home'
                        }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'training',
                component: CommandTrainingComponent,
                data: {
                    permissions: {
                        only: Permissions.COMMAND,
                        except: Permissions.UNLOGGED,
                        redirectTo: {
                            COMMAND: '/home',
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
export class CommandRoutingModule {}
