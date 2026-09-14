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
import { OperationsOperationDetailComponent } from './components/operations-operation-detail/operations-operation-detail.component';
import { OperationsMissionDetailComponent } from './components/operations-mission-detail/operations-mission-detail.component';
import { OperationsIntelDetailComponent } from './components/operations-intel-detail/operations-intel-detail.component';
import { OperationsWarnoDetailComponent } from './components/operations-warno-detail/operations-warno-detail.component';
import { OperationsCampaignEditorComponent } from './components/operations-campaign-editor/operations-campaign-editor.component';
import { OperationsOperationEditorComponent } from './components/operations-operation-editor/operations-operation-editor.component';
import { OperationsIntelEditorComponent } from './components/operations-intel-editor/operations-intel-editor.component';
import { NpcVoicesService } from './services/npc-voices.service';

const testerRouteData = {
    permissions: {
        only: Permissions.TESTER,
        except: Permissions.UNLOGGED,
        redirectTo: { UNLOGGED: loginRedirect, default: '/operations/aar' }
    }
};

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
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/new',
                component: OperationsCampaignEditorComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId',
                component: OperationsCampaignDetailComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/edit',
                component: OperationsCampaignEditorComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/intel/new',
                component: OperationsIntelEditorComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/intel/:intelId',
                component: OperationsIntelDetailComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/intel/:intelId/edit',
                component: OperationsIntelEditorComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/new',
                component: OperationsOperationEditorComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/:operationId',
                component: OperationsOperationDetailComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/:operationId/edit',
                component: OperationsOperationEditorComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/:operationId/intel/new',
                component: OperationsIntelEditorComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/:operationId/intel/:intelId',
                component: OperationsIntelDetailComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/:operationId/intel/:intelId/edit',
                component: OperationsIntelEditorComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/:operationId/missions/:missionId',
                component: OperationsMissionDetailComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/:operationId/missions/:missionId/intel/new',
                component: OperationsIntelEditorComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/:operationId/missions/:missionId/intel/:intelId',
                component: OperationsIntelDetailComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/:operationId/missions/:missionId/intel/:intelId/edit',
                component: OperationsIntelEditorComponent,
                data: testerRouteData,
                canActivate: [NgxPermissionsGuard]
            },
            {
                path: 'campaigns/:campaignId/operations/:operationId/missions/:missionId/warno',
                component: OperationsWarnoDetailComponent,
                data: testerRouteData,
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
