import { NgModule } from '@angular/core';
import { RouterModule, Routes, ActivatedRouteSnapshot, RouterStateSnapshot, DefaultUrlSerializer, UrlTree } from '@angular/router';
import { HomePageComponent } from './Pages/home-page/home-page.component';
import { LoginPageComponent } from './Pages/login-page/login-page.component';
import { ProfilePageComponent } from './Pages/profile-page/profile-page.component';
import { RecruitmentPageComponent } from './Pages/recruitment-page/recruitment-page.component';
import { RecruitmentApplicationPageComponent } from './Pages/recruitment-application-page/recruitment-application-page.component';
import { LivePageComponent } from './Pages/live-page/live-page.component';
import { AboutPageComponent } from './Pages/about-page/about-page.component';
import { DocsPageComponent } from './Pages/docs-page/docs-page.component';
import { RulesPageComponent } from './Pages/rules-page/rules-page.component';
import { PolicyPageComponent } from './Pages/policy-page/policy-page.component';
import { InformationPageComponent } from './Pages/information-page/information-page.component';
import { ModpackPageComponent } from './Pages/modpack-page/modpack-page.component';
import { UnitPageComponent } from './Pages/unit-page/unit-page.component';
import { OprepPageComponent } from './Pages/oprep-page/oprep-page.component';
import { AdminErrorLogsComponent } from './Components/admin/admin-error-logs/admin-error-logs.component';
import { AdminAuditLogsComponent } from './Components/admin/admin-audit-logs/admin-audit-logs.component';
import { OpordPageComponent } from './Pages/opord-page/opord-page.component';
import { UnitsOrbatComponent } from './Components/units/units-orbat/units-orbat.component';
import { UnitsOrbatAuxComponent } from './Components/units/units-orbat-aux/units-orbat-aux.component';
import { UnitsRosterComponent } from './Components/units/units-roster/units-roster.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { CommandUnitsComponent } from './Components/command/command-units/command-units.component';
import { CommandRanksComponent } from './Components/command/command-ranks/command-ranks.component';
import { CommandRolesComponent } from './Components/command/command-roles/command-roles.component';
import { CommandRequestsComponent } from './Components/command/command-requests/command-requests.component';
import { OperationsActivityComponent } from './Components/operations/operations-activity/operations-activity.component';
import { OperationsOrdersComponent } from './Components/operations/operations-orders/operations-orders.component';
import { OperationsReportsComponent } from './Components/operations/operations-reports/operations-reports.component';
import { OperationsServersComponent } from './Components/operations/operations-servers/operations-servers.component';
import { AdminVariablesComponent } from './Components/admin/admin-variables/admin-variables.component';
import { AdminLogsComponent } from './Components/admin/admin-logs/admin-logs.component';
import { HttpClient } from '@angular/common/http';
import { AdminToolsComponent } from './Components/admin/admin-tools/admin-tools.component';
import { Permissions } from './Services/permissions';
import { ApplicationPageComponent } from './Pages/application-page/application-page.component';
import { AdminLauncherLogsComponent } from './Components/admin/admin-launcher-logs/admin-launcher-logs.component';
import { PersonnelLoasComponent } from './Components/personnel/personnel-loas/personnel-loas.component';
import { PersonnelDischargesComponent } from './Components/personnel/personnel-discharges/personnel-discharges.component';
import { PersonnelActivityComponent } from './Components/personnel/personnel-activity/personnel-activity.component';

const appRoutes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomePageComponent },
    { path: 'login', component: LoginPageComponent },
    { path: 'application', component: ApplicationPageComponent },
    {
        path: 'profile', component: ProfilePageComponent, data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'profile/:id', component: ProfilePageComponent, data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'admin', redirectTo: 'admin/audit', data: {
            permissions: {
                only: Permissions.ADMIN,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    ADMIN: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'admin/logs', component: AdminLogsComponent, data: {
            permissions: {
                only: Permissions.ADMIN,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    ADMIN: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'admin/errors', component: AdminErrorLogsComponent, data: {
            permissions: {
                only: Permissions.ADMIN,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    ADMIN: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'admin/audit', component: AdminAuditLogsComponent, data: {
            permissions: {
                only: Permissions.ADMIN,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    ADMIN: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'admin/launcher', component: AdminLauncherLogsComponent, data: {
            permissions: {
                only: Permissions.ADMIN,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    ADMIN: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'admin/tools', component: AdminToolsComponent, data: {
            permissions: {
                only: Permissions.ADMIN,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    ADMIN: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'admin/variables', component: AdminVariablesComponent, data: {
            permissions: {
                only: Permissions.ADMIN,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    ADMIN: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'recruitment', component: RecruitmentPageComponent, data: {
            permissions: {
                only: Permissions.RECRUITER,
                except: Permissions.UNLOGGED,
                redirectTo: '/home'
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'recruitment/:id', component: RecruitmentApplicationPageComponent, data: {
            permissions: {
                only: Permissions.RECRUITER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    { path: 'information', component: InformationPageComponent },
    { path: 'about', redirectTo: 'information/about' },
    { path: 'information/about', component: AboutPageComponent },
    {
        path: 'information/modpack', component: ModpackPageComponent, data: {
            permissions: {
                except: [Permissions.UNLOGGED, Permissions.UNCONFIRMED],
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    UNCONFIRMED: '/home',
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'units', redirectTo: 'units/orbat', data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'units/orbat', component: UnitsOrbatComponent, data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'units/auxiliary', component: UnitsOrbatAuxComponent, data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'units/roster', component: UnitsRosterComponent, data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'units/:id', component: UnitPageComponent, data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'live', component: LivePageComponent, data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'command', redirectTo: 'command/requests', data: {
            permissions: {
                only: Permissions.COMMAND,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    COMMAND: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'command/requests', component: CommandRequestsComponent, data: {
            permissions: {
                only: Permissions.COMMAND,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    COMMAND: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'command/units', component: CommandUnitsComponent, data: {
            permissions: {
                only: Permissions.COMMAND,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    COMMAND: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'command/ranks', component: CommandRanksComponent, data: {
            permissions: {
                only: Permissions.COMMAND,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    COMMAND: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'command/roles', component: CommandRolesComponent, data: {
            permissions: {
                only: Permissions.COMMAND,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    COMMAND: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'operations', redirectTo: 'operations/servers', data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    MEMBER: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'operations/servers', component: OperationsServersComponent, data: {
            permissions: {
                only: Permissions.SERVERS,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    SERVERS: '/operations/opords',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'operations/opords', component: OperationsOrdersComponent, data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    MEMBER: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'operations/opreps', component: OperationsReportsComponent, data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    MEMBER: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'operations/opreps/:id', component: OprepPageComponent, data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    MEMBER: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'operations/opords/:id', component: OpordPageComponent, data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    MEMBER: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'operations/activity', component: OperationsActivityComponent, data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    MEMBER: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'personnel', redirectTo: 'personnel/loas', data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    MEMBER: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'personnel/loas', component: PersonnelLoasComponent, data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    MEMBER: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'personnel/activity', component: PersonnelActivityComponent, data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    MEMBER: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'personnel/discharges', component: PersonnelDischargesComponent, data: {
            permissions: {
                only: Permissions.DISCHARGES,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    DISCHARGES: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'personnel/discharges/:filter', component: PersonnelDischargesComponent, data: {
            permissions: {
                only: Permissions.DISCHARGES,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    DISCHARGES: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }, canActivate: [NgxPermissionsGuard]
    },
    { path: 'docs', component: DocsPageComponent },
    { path: 'docs/:id', component: DocsPageComponent },
    { path: 'policy', component: PolicyPageComponent },
    { path: 'rules', component: RulesPageComponent },
    { path: '**', redirectTo: 'Login' }
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes)
    ],
    exports: [
        RouterModule
    ]
})

export class AppRoutingModule {
    static instance: AppRoutingModule;
    constructor(public httpClient: HttpClient) {
        AppRoutingModule.instance = this;
    }
}

export function loginRedirect(rejectedPermissionName: string, activatedRouteSnapshot: ActivatedRouteSnapshot, routerStateSnapshot: RouterStateSnapshot) {
    LoginPageComponent.staticRedirect = routerStateSnapshot.url.substring(1);
    return '/login';
}

export class LowerCaseUrlSerializer extends DefaultUrlSerializer {
    parse(url: string): UrlTree {
        return super.parse(url.toLowerCase());
    }
}
