import { Routes } from '@angular/router';
import { NgxPermissionsGuard } from 'ngx-permissions';
import { Permissions } from '@app/core/services/permissions';
import { loginRedirect } from '@app/login-redirect';
import { InformationPageComponent } from './components/information-page/information-page.component';
import { AboutPageComponent } from './components/about-page/about-page.component';
import { RulesPageComponent } from './components/rules-page/rules-page.component';
import { PolicyPageComponent } from './components/policy-page/policy-page.component';
import { BoardsListComponent } from './components/boards-list/boards-list.component';
import { BoardComponent } from './components/board/board.component';

export const INFORMATION_ROUTES: Routes = [
    { path: '', component: InformationPageComponent },
    { path: 'about', component: AboutPageComponent },
    { path: 'rules', component: RulesPageComponent },
    { path: 'policy', component: PolicyPageComponent },
    {
        path: 'boards',
        component: BoardsListComponent,
        canActivate: [NgxPermissionsGuard],
        data: { permissions: { only: Permissions.MEMBER, except: Permissions.UNLOGGED, redirectTo: { UNLOGGED: loginRedirect, default: '/home' } } }
    },
    {
        path: 'boards/:boardId',
        component: BoardComponent,
        canActivate: [NgxPermissionsGuard],
        data: { permissions: { only: Permissions.MEMBER, except: Permissions.UNLOGGED, redirectTo: { UNLOGGED: loginRedirect, default: '/home' } } }
    }
];
