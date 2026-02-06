import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgxPermissionsModule } from 'ngx-permissions';
import { SharedModule } from '@shared/shared.module';

// Material modules
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Core components
import { HeaderBarComponent } from './components/header-bar/header-bar.component';
import { FooterBarComponent } from './components/footer-bar/footer-bar.component';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { NotificationsComponent } from './components/notifications/notifications.component';

const CORE_COMPONENTS = [
    HeaderBarComponent,
    FooterBarComponent,
    SideBarComponent,
    NotificationsComponent,
];

@NgModule({
    declarations: [
        ...CORE_COMPONENTS,
    ],
    imports: [
        CommonModule,
        RouterModule,
        NgxPermissionsModule,
        SharedModule,
        MatBadgeModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatSidenavModule,
        MatToolbarModule,
        MatTooltipModule,
    ],
    exports: [
        ...CORE_COMPONENTS,
    ],
})
export class CoreModule {}
