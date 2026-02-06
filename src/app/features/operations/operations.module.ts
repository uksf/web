import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MarkdownModule } from 'ngx-markdown';
import { SharedModule } from '@shared/shared.module';
import { OperationsRoutingModule } from './operations-routing.module';
import { OperationsPageComponent } from './components/operations-page/operations-page.component';
import { OperationsServersComponent } from './components/operations-servers/operations-servers.component';
import { OperationsAarComponent } from './components/operations-aar/operations-aar.component';
import { OperationsActivityComponent } from './components/operations-activity/operations-activity.component';
import { OperationsOrdersComponent } from './components/operations-orders/operations-orders.component';
import { OperationsReportsComponent } from './components/operations-reports/operations-reports.component';
import { OprepPageComponent } from './components/oprep-page/oprep-page.component';
import { OpordPageComponent } from './components/opord-page/opord-page.component';
import { AddServerModalComponent } from './modals/add-server-modal/add-server-modal.component';
import { EditServerModsModalComponent } from './modals/edit-server-mods-modal/edit-server-mods-modal.component';
import { CreateOperationReportModalComponent } from './modals/create-operation-report-modal/create-operation-report-modal.component';
import { CreateOperationOrderComponent } from './modals/create-operation-order/create-operation-order.component';

@NgModule({
    declarations: [
        OperationsPageComponent,
        OperationsServersComponent,
        OperationsAarComponent,
        OperationsActivityComponent,
        OperationsOrdersComponent,
        OperationsReportsComponent,
        OprepPageComponent,
        OpordPageComponent,
        AddServerModalComponent,
        EditServerModsModalComponent,
        CreateOperationReportModalComponent,
        CreateOperationOrderComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        OperationsRoutingModule,
        NgxPermissionsModule.forChild(),
        MarkdownModule.forChild(),
        DragDropModule,
        MatExpansionModule,
        MatTabsModule,
    ],
})
export class OperationsModule {}
