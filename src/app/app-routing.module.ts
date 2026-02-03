import { Injectable, NgModule } from '@angular/core';
import { ActivatedRouteSnapshot, DefaultUrlSerializer, RouterModule, RouterStateSnapshot, Routes, UrlTree } from '@angular/router';
import { HomePageComponent } from './Pages/home-page/home-page.component';
import { LoginPageComponent } from './Pages/login-page/login-page.component';
import { ProfilePageComponent } from './Pages/profile-page/profile-page.component';
import { RecruitmentPageComponent } from './recruitment/recruitment-page/recruitment-page.component';
import { RecruitmentApplicationPageComponent } from './recruitment/recruitment-application-page/recruitment-application-page.component';
import { LivePageComponent } from './Pages/live-page/live-page.component';
import { AboutPageComponent } from './Pages/about-page/about-page.component';
import { DocsPageComponent } from './Pages/docs-page/docs-page.component';
import { RulesPageComponent } from './Pages/rules-page/rules-page.component';
import { PolicyPageComponent } from './Pages/policy-page/policy-page.component';
import { InformationPageComponent } from './Pages/information-page/information-page.component';
import { UnitPageComponent } from './Pages/unit-page/unit-page.component';
import { UnitsOrbatComponent } from './Components/units/units-orbat/units-orbat.component';
import { UnitsOrbatAuxComponent } from './Components/units/units-orbat-aux/units-orbat-aux.component';
import { UnitsOrbatSecondaryComponent } from './Components/units/units-orbat-secondary/units-orbat-secondary.component';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { CommandUnitsComponent } from './Components/command/command-units/command-units.component';
import { CommandRanksComponent } from './Components/command/command-ranks/command-ranks.component';
import { CommandRolesComponent } from './Components/command/command-roles/command-roles.component';
import { CommandRequestsComponent } from './Components/command/command-requests/command-requests.component';
import { OperationsServersComponent } from './Components/operations/operations-servers/operations-servers.component';
import { OperationsAarComponent } from './Components/operations/operations-aar/operations-aar.component';
import { HttpClient } from '@angular/common/http';
import { Permissions } from './Services/permissions';
import { ApplicationPageComponent } from './Pages/application-page/application-page.component';
import { CommandMembersComponent } from './Components/command/command-members/command-members.component';
import { CommandTrainingComponent } from './Components/command/command-training/command-training.component';
import { ModpackGuideComponent } from './modpack/modpack-guide/modpack-guide.component';
import { ModpackReleasesComponent } from './modpack/modpack-releases/modpack-releases.component';
import { ModpackBuildsDevComponent } from './modpack/modpack-builds-dev/modpack-builds-dev.component';
import { ModpackBuildsRcComponent } from './modpack/modpack-builds-rc/modpack-builds-rc.component';
import { ModpackWorkshopComponent } from './modpack/modpack-workshop/modpack-workshop.component';

const appRoutes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomePageComponent },
    { path: 'login', component: LoginPageComponent },
    { path: 'application', component: ApplicationPageComponent },
    {
        path: 'profile',
        component: ProfilePageComponent,
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        },
        canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'profile/:id',
        component: ProfilePageComponent,
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
        component: RecruitmentPageComponent,
        data: {
            permissions: {
                only: Permissions.RECRUITER,
                except: Permissions.UNLOGGED,
                redirectTo: '/home'
            }
        },
        canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'recruitment/:id',
        component: RecruitmentApplicationPageComponent,
        data: {
            permissions: {
                only: Permissions.RECRUITER,
                except: Permissions.UNLOGGED,
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    default: '/home'
                }
            }
        },
        canActivate: [NgxPermissionsGuard]
    },
    { path: 'information', component: InformationPageComponent },
    { path: 'about', redirectTo: 'information/about' },
    { path: 'information/about', component: AboutPageComponent },
    {
        path: 'information/docs',
        component: DocsPageComponent,
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
    },
    { path: 'units/roster', redirectTo: 'personnel/roster' },
    {
        path: 'units',
        redirectTo: 'units/orbat',
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        }
    },
    {
        path: 'units/orbat',
        component: UnitsOrbatComponent,
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        },
        canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'units/auxiliary',
        component: UnitsOrbatAuxComponent,
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        },
        canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'units/secondary',
        component: UnitsOrbatSecondaryComponent,
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        },
        canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'units/:id',
        component: UnitPageComponent,
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        },
        canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'live',
        component: LivePageComponent,
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        },
        canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'command',
        redirectTo: 'command/requests',
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
        path: 'command/requests',
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
        path: 'command/members',
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
        path: 'command/units',
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
        path: 'command/ranks',
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
        path: 'command/roles',
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
        path: 'command/training',
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
    },
    {
        path: 'operations',
        redirectTo: 'operations/servers'
    },
    {
        path: 'operations/servers',
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
        path: 'operations/aar',
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
    },
    // {
    //     path: 'operations/opords',
    //     component: OperationsOrdersComponent,
    //     data: {
    //         permissions: {
    //             only: Permissions.MEMBER,
    //             except: Permissions.UNLOGGED,
    //             redirectTo: {
    //                 UNLOGGED: loginRedirect,
    //                 default: '/home'
    //             }
    //         }
    //     },
    //     canActivate: [NgxPermissionsGuard]
    // },
    // {
    //     path: 'operations/opreps',
    //     component: OperationsReportsComponent,
    //     data: {
    //         permissions: {
    //             only: Permissions.MEMBER,
    //             except: Permissions.UNLOGGED,
    //             redirectTo: {
    //                 MEMBER: '/home',
    //                 UNLOGGED: loginRedirect,
    //                 default: '/home'
    //             }
    //         }
    //     },
    //     canActivate: [NgxPermissionsGuard]
    // },
    // {
    //     path: 'operations/opreps/:id',
    //     component: OprepPageComponent,
    //     data: {
    //         permissions: {
    //             only: Permissions.MEMBER,
    //             except: Permissions.UNLOGGED,
    //             redirectTo: {
    //                 MEMBER: '/home',
    //                 UNLOGGED: loginRedirect,
    //                 default: '/home'
    //             }
    //         }
    //     },
    //     canActivate: [NgxPermissionsGuard]
    // },
    // {
    //     path: 'operations/opords/:id',
    //     component: OpordPageComponent,
    //     data: {
    //         permissions: {
    //             only: Permissions.MEMBER,
    //             except: Permissions.UNLOGGED,
    //             redirectTo: {
    //                 MEMBER: '/home',
    //                 UNLOGGED: loginRedirect,
    //                 default: '/home'
    //             }
    //         }
    //     },
    //     canActivate: [NgxPermissionsGuard]
    // },
    // {
    //     path: 'operations/activity',
    //     component: OperationsActivityComponent,
    //     data: {
    //         permissions: {
    //             only: Permissions.MEMBER,
    //             except: Permissions.UNLOGGED,
    //             redirectTo: {
    //                 MEMBER: '/home',
    //                 UNLOGGED: loginRedirect,
    //                 default: '/home'
    //             }
    //         }
    //     },
    //     canActivate: [NgxPermissionsGuard]
    // },
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
        redirectTo: 'modpack/guide',
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
    {
        path: 'modpack/guide',
        component: ModpackGuideComponent,
        data: {
            permissions: {
                except: [Permissions.UNLOGGED, Permissions.UNCONFIRMED],
                redirectTo: {
                    UNLOGGED: loginRedirect,
                    UNCONFIRMED: '/home',
                    default: '/home'
                }
            }
        },
        canActivate: [NgxPermissionsGuard]
    },
    {
        path: 'modpack/releases',
        component: ModpackReleasesComponent,
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
    },
    {
        path: 'modpack/builds-dev',
        component: ModpackBuildsDevComponent,
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
    },
    {
        path: 'modpack/builds-rc',
        component: ModpackBuildsRcComponent,
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
    },
    {
        path: 'modpack/workshop',
        component: ModpackWorkshopComponent,
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
    },
    { path: 'policy', component: PolicyPageComponent },
    { path: 'rules', component: RulesPageComponent },
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
