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
import { AddServerModalComponent } from './modals/add-server-modal/add-server-modal.component';
import { EditServerModsModalComponent } from './modals/edit-server-mods-modal/edit-server-mods-modal.component';
import { GameServersService } from './services/game-servers.service';

@NgModule({
    declarations: [
        OperationsPageComponent,
        OperationsServersComponent,
        OperationsAarComponent,
        AddServerModalComponent,
        EditServerModsModalComponent,
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
    providers: [GameServersService],
})
export class OperationsModule {}
