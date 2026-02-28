import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/components/home-page/home-page.component';
import { LoginPageComponent } from './features/auth/components/login-page/login-page.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { loginRedirect } from '@app/login-redirect';

export const appRoutes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomePageComponent },
    {
        path: 'login',
        component: LoginPageComponent,
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                only: Permissions.UNLOGGED,
                redirectTo: '/home'
            }
        }
    },
    { path: 'application', loadChildren: () => import('./features/application/application.routes').then(m => m.APPLICATION_ROUTES) },
    {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
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
    },
    {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
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
        loadChildren: () => import('./features/recruitment/recruitment.routes').then(m => m.RECRUITMENT_ROUTES),
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
        loadChildren: () => import('./features/information/information.routes').then(m => m.INFORMATION_ROUTES)
    },
    { path: 'about', redirectTo: 'information/about' },
    {
        path: 'information/docs',
        loadChildren: () => import('./features/docs/docs.routes').then(m => m.DOCS_ROUTES),
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
        loadChildren: () => import('./features/units/units.routes').then(m => m.UNITS_ROUTES),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }
    },
    {
        path: 'command',
        loadChildren: () => import('./features/command/command.routes').then(m => m.COMMAND_ROUTES),
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
        loadChildren: () => import('./features/operations/operations.routes').then(m => m.OPERATIONS_ROUTES),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }
    },
    {
        path: 'personnel',
        loadChildren: () => import('./features/personnel/personnel.routes').then(m => m.PERSONNEL_ROUTES),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        }
    },
    {
        path: 'modpack',
        loadChildren: () => import('./features/modpack/modpack.routes').then(m => m.MODPACK_ROUTES),
        canActivate: [NgxPermissionsGuard],
        data: {
            permissions: {
                except: [Permissions.UNLOGGED, Permissions.UNCONFIRMED],
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    UNCONFIRMED: '/home',
                    default: '/home'
                }
            }
        }
    },
    { path: 'policy', redirectTo: 'information/policy' },
    { path: 'rules', redirectTo: 'information/rules' },
    { path: '**', redirectTo: 'home' }
];
