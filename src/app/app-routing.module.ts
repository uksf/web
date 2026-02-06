import { Injectable, NgModule } from '@angular/core';
import { ActivatedRouteSnapshot, DefaultUrlSerializer, RouterModule, RouterStateSnapshot, Routes, UrlTree } from '@angular/router';
import { HomePageComponent } from './features/home/components/home-page/home-page.component';
import { LoginPageComponent } from './features/auth/components/login-page/login-page.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { HttpClient } from '@angular/common/http';
import { Permissions } from '@app/core/services/permissions';

const appRoutes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomePageComponent },
    { path: 'login', component: LoginPageComponent },
    { path: 'application', loadChildren: () => import('./features/application/application.module').then(m => m.ApplicationModule) },
    {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule),
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        },
        canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                only: Permissions.ADMIN,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    ADMIN: '/home',
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }
    },
    {
        path: 'recruitment',
        loadChildren: () => import('./features/recruitment/recruitment.module').then(m => m.RecruitmentModule),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                only: Permissions.RECRUITER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }
    },
    {
        path: 'information',
        loadChildren: () => import('./features/information/information.module').then(m => m.InformationModule)
    },
    { path: 'about', redirectTo: 'information/about' },
    {
        path: 'information/docs',
        loadChildren: () => import('./features/docs/docs.module').then(m => m.DocsModule),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }
    },
    { path: 'units/roster', redirectTo: 'personnel/roster' },
    {
        path: 'units',
        loadChildren: () => import('./features/units/units.module').then(m => m.UnitsModule),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }
    },
    {
        path: 'command',
        loadChildren: () => import('./features/command/command.module').then(m => m.CommandModule),
        canActivate: [NgxPermissionsGuard],
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
        }
    },
    {
        path: 'operations',
        loadChildren: () => import('./features/operations/operations.module').then(m => m.OperationsModule),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }
    },
    {
        path: 'personnel',
        loadChildren: () => import('./features/personnel/personnel.module').then(m => m.PersonnelModule),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }
    },
    {
        path: 'modpack',
        loadChildren: () => import('./features/modpack/modpack.module').then(m => m.ModpackModule),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                only: Permissions.MEMBER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }
    },
    { path: 'policy', redirectTo: 'information/policy' },
    { path: 'rules', redirectTo: 'information/rules' },
    { path: '**', redirectTo: 'Login' }
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
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

@Injectable()
export class LowerCaseUrlSerializer extends DefaultUrlSerializer {
    parse(url: string): UrlTree {
        return super.parse(url.toLowerCase());
    }
}
