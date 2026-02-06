import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { loginRedirect } from '@app/app-routing.module';

import { ModpackGuideComponent } from './modpack-guide/modpack-guide.component';
import { ModpackReleasesComponent } from './modpack-releases/modpack-releases.component';
import { ModpackBuildsDevComponent } from './modpack-builds-dev/modpack-builds-dev.component';
import { ModpackBuildsRcComponent } from './modpack-builds-rc/modpack-builds-rc.component';
import { ModpackWorkshopComponent } from './modpack-workshop/modpack-workshop.component';

const routes: Routes = [
    { path: '', redirectTo: 'guide', pathMatch: 'full' },
    {
        path: 'guide',
        component: ModpackGuideComponent,
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
    {
        path: 'releases',
        component: ModpackReleasesComponent,
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
    {
        path: 'builds-dev',
        component: ModpackBuildsDevComponent,
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
    {
        path: 'builds-rc',
        component: ModpackBuildsRcComponent,
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
    {
        path: 'workshop',
        component: ModpackWorkshopComponent,
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
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ModpackRoutingModule {}
