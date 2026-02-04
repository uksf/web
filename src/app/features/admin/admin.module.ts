import { NgModule } from '@angular/core';
import { NgxPermissionsModule } from 'ngx-permissions';

// Angular Material (admin-specific)
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

// Routing
import { AdminRoutingModule } from './admin-routing.module';

// Shared Module
import { SharedModule } from '@shared/shared.module';

// Components
import { AdminPageComponent } from './components/admin-page/admin-page.component';
import { AdminLogsComponent } from './components/admin-logs/admin-logs.component';
import { AdminErrorLogsComponent } from './components/admin-error-logs/admin-error-logs.component';
import { AdminAuditLogsComponent } from './components/admin-audit-logs/admin-audit-logs.component';
import { AdminDiscordLogsComponent } from './components/admin-discord-logs/admin-discord-logs.component';
import { AdminLauncherLogsComponent } from './components/admin-launcher-logs/admin-launcher-logs.component';
import { AdminToolsComponent } from './components/admin-tools/admin-tools.component';
import { AdminVariablesComponent } from './components/admin-variables/admin-variables.component';
import { AdminServersComponent } from './components/admin-servers/admin-servers.component';

@NgModule({
  declarations: [
    AdminPageComponent,
    AdminLogsComponent,
    AdminErrorLogsComponent,
    AdminAuditLogsComponent,
    AdminDiscordLogsComponent,
    AdminLauncherLogsComponent,
    AdminToolsComponent,
    AdminVariablesComponent,
    AdminServersComponent,
  ],
  imports: [
    SharedModule,
    AdminRoutingModule,
    NgxPermissionsModule.forChild(),
    // Admin-specific modules
    MatExpansionModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
})
export class AdminModule {}
