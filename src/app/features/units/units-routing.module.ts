import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { loginRedirect } from '@app/app-routing.module';
import { UnitsPageComponent } from './components/units-page/units-page.component';
import { UnitsOrbatComponent } from './components/units-orbat/units-orbat.component';
import { UnitsOrbatAuxComponent } from './components/units-orbat-aux/units-orbat-aux.component';
import { UnitsOrbatSecondaryComponent } from './components/units-orbat-secondary/units-orbat-secondary.component';
import { UnitPageComponent } from './components/unit-page/unit-page.component';

const routes: Routes = [
    {
        path: '',
        component: UnitsPageComponent,
        children: [
            { path: '', redirectTo: 'orbat', pathMatch: 'full' },
            {
                path: 'orbat',
                component: UnitsOrbatComponent,
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
                path: 'auxiliary',
                component: UnitsOrbatAuxComponent,
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
                path: 'secondary',
                component: UnitsOrbatSecondaryComponent,
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
            }
        ]
    },
    {
        path: ':id',
        component: UnitPageComponent,
        data: {
            permissions: {
                except: Permissions.UNLOGGED,
                redirectTo: loginRedirect
            }
        },
        canActivate: [NgxPermissionsGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UnitsRoutingModule {}
