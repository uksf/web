import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { NgxPermissionsModule } from 'ngx-permissions';
import { SharedModule } from '@shared/shared.module';
import { UnitsRoutingModule } from './units-routing.module';
import { UnitsPageComponent } from './components/units-page/units-page.component';
import { UnitPageComponent } from './components/unit-page/unit-page.component';
import { UnitsOrbatComponent } from './components/units-orbat/units-orbat.component';
import { UnitsOrbatAuxComponent } from './components/units-orbat-aux/units-orbat-aux.component';
import { UnitsOrbatSecondaryComponent } from './components/units-orbat-secondary/units-orbat-secondary.component';
import { OrganizationChartModule } from 'primeng/organizationchart';

@NgModule({
    declarations: [
        UnitsPageComponent,
        UnitPageComponent,
        UnitsOrbatComponent,
        UnitsOrbatAuxComponent,
        UnitsOrbatSecondaryComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        UnitsRoutingModule,
        NgxPermissionsModule.forChild(),
        OrganizationChartModule,
        MatTabsModule,
    ],
})
export class UnitsModule {}
