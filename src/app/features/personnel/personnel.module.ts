import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { SharedModule } from '@shared/shared.module';
import { PersonnelRoutingModule } from './personnel-routing.module';
import { PersonnelPageComponent } from './components/personnel-page/personnel-page.component';
import { PersonnelLoasComponent } from './components/personnel-loas/personnel-loas.component';
import { PersonnelLoasListComponent } from './components/personnel-loas-list/personnel-loas-list.component';
import { PersonnelActivityComponent } from './components/personnel-activity/personnel-activity.component';
import { PersonnelDischargesComponent } from './components/personnel-discharges/personnel-discharges.component';
import { PersonnelRosterComponent } from './components/personnel-roster/personnel-roster.component';
import { DischargesService } from './services/discharges.service';

@NgModule({
    declarations: [
        PersonnelPageComponent,
        PersonnelLoasComponent,
        PersonnelLoasListComponent,
        PersonnelActivityComponent,
        PersonnelDischargesComponent,
        PersonnelRosterComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        PersonnelRoutingModule,
        NgxPermissionsModule.forChild(),
        MatButtonToggleModule,
        MatDatepickerModule,
        MatDividerModule,
        MatExpansionModule,
        MatTableModule,
        MatTabsModule,
    ],
    providers: [DischargesService],
})
export class PersonnelModule {}
