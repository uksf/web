import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { SharedModule } from '@shared/shared.module';
import { CommandRoutingModule } from './command-routing.module';

// Components
import { CommandPageComponent } from './components/command-page/command-page.component';
import { CommandRequestsComponent } from './components/command-requests/command-requests.component';
import { CommandMembersComponent } from './components/command-members/command-members.component';
import { CommandMemberCardComponent } from './components/command-members/command-member-card/command-member-card.component';
import { CommandUnitGroupCardComponent } from './components/command-members/command-unit-group-card/command-unit-group-card.component';
import { CommandUnitsComponent } from './components/command-units/command-units.component';
import { CommandRanksComponent } from './components/command-ranks/command-ranks.component';
import { CommandRolesComponent } from './components/command-roles/command-roles.component';
import { CommandTrainingComponent } from './components/command-training/command-training.component';

// Modals
import { AddRankModalComponent } from './modals/add-rank-modal/add-rank-modal.component';
import { AddTrainingModalComponent } from './modals/add-training-modal/add-training-modal.component';
import { AddUnitModalComponent } from './modals/add-unit-modal/add-unit-modal.component';
import { EditMemberTrainingModalComponent } from './modals/edit-member-training-modal/edit-member-training-modal.component';
import { RequestChainOfCommandPositionModalComponent } from './modals/request-chain-of-command-position-modal/request-chain-of-command-position-modal.component';
import { RequestDischargeModalComponent } from './modals/request-discharge-modal/request-discharge-modal.component';
import { RequestRankModalComponent } from './modals/request-rank-modal/request-rank-modal.component';
import { RequestRoleModalComponent } from './modals/request-role-modal/request-role-modal.component';
import { RequestTransferModalComponent } from './modals/request-transfer-modal/request-transfer-modal.component';
import { RequestUnitRemovalModalComponent } from './modals/request-unit-removal-modal/request-unit-removal-modal.component';

// Material modules
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TreeModule } from '@circlon/angular-tree-component';
import { RanksService } from './services/ranks.service';
import { RolesService } from './services/roles.service';

@NgModule({
    declarations: [
        // Components
        CommandPageComponent,
        CommandRequestsComponent,
        CommandMembersComponent,
        CommandMemberCardComponent,
        CommandUnitGroupCardComponent,
        CommandUnitsComponent,
        CommandRanksComponent,
        CommandRolesComponent,
        CommandTrainingComponent,
        // Modals
        AddRankModalComponent,
        AddTrainingModalComponent,
        AddUnitModalComponent,
        EditMemberTrainingModalComponent,
        RequestChainOfCommandPositionModalComponent,
        RequestDischargeModalComponent,
        RequestRankModalComponent,
        RequestRoleModalComponent,
        RequestTransferModalComponent,
        RequestUnitRemovalModalComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        CommandRoutingModule,
        NgxPermissionsModule.forChild(),
        MatExpansionModule,
        MatTabsModule,
        MatTableModule,
        MatDatepickerModule,
        MatSlideToggleModule,
        DragDropModule,
        TreeModule,
    ],
    providers: [RanksService, RolesService],
})
export class CommandModule {}
