import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { PermissionsService } from '@app/core/services/permissions.service';
import { loginRedirect } from '@app/login-redirect';
import { OperationsPageComponent } from './components/operations-page/operations-page.component';
import { OperationsServersComponent } from './components/operations-servers/operations-servers.component';
import { OperationsAarComponent } from './components/operations-aar/operations-aar.component';
import { OperationsMissionsComponent } from './components/operations-missions/operations-missions.component';
import { OperationsNpcsComponent } from './components/operations-npcs/operations-npcs.component';
import { OperationsCampaignsComponent } from './components/operations-campaigns/operations-campaigns.component';
import { OperationsCampaignDetailComponent } from './components/operations-campaign-detail/operations-campaign-detail.component';
import { OperationsOpDetailComponent } from './components/operations-op-detail/operations-op-detail.component';
import { OperationsIntelDetailComponent } from './components/operations-intel-detail/operations-intel-detail.component';
import { OperationsWarnoDetailComponent } from './components/operations-warno-detail/operations-warno-detail.component';
import { NpcVoicesService } from './services/npc-voices.service';
export const OPERATIONS_ROUTES: Routes = [
    {
        path: '',
        component: OperationsPageComponent,
        children: [
            {
                path: '',
                redirectTo: () => (inject(PermissionsService).hasPermission(Permissions.TESTER) ? 'campaigns' : 'servers'),
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
                path: 'missions',
                component: OperationsMissionsComponent,
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
                path: 'npcs',
                component: OperationsNpcsComponent,
                providers: [NpcVoicesService],
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
                path: 'campaigns',
                component: OperationsCampaignsComponent,
                data: {
                    permissions: {
                        only: Permissions.TESTER,
                        except: Permissions.UNLOGGED,
                        redirectTo: { UNLOGGED: loginRedirect, default: '/operations/aar' }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:id',
                component: OperationsCampaignDetailComponent,
                data: {
                    permissions: {
                        only: Permissions.TESTER,
                        except: Permissions.UNLOGGED,
                        redirectTo: { UNLOGGED: loginRedirect, default: '/operations/aar' }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:id/ops/:opId',
                component: OperationsOpDetailComponent,
                data: {
                    permissions: {
                        only: Permissions.TESTER,
                        except: Permissions.UNLOGGED,
                        redirectTo: { UNLOGGED: loginRedirect, default: '/operations/aar' }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:id/intel/:intelId',
                component: OperationsIntelDetailComponent,
                data: {
                    permissions: {
                        only: Permissions.TESTER,
                        except: Permissions.UNLOGGED,
                        redirectTo: { UNLOGGED: loginRedirect, default: '/operations/aar' }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:id/ops/:opId/intel/:intelId',
                component: OperationsIntelDetailComponent,
                data: {
                    permissions: {
                        only: Permissions.TESTER,
                        except: Permissions.UNLOGGED,
                        redirectTo: { UNLOGGED: loginRedirect, default: '/operations/aar' }
                    }
                },
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:id/ops/:opId/warno',
                component: OperationsWarnoDetailComponent,
                data: {
                    permissions: {
                        only: Permissions.TESTER,
                        except: Permissions.UNLOGGED,
                        redirectTo: { UNLOGGED: loginRedirect, default: '/operations/aar' }
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
