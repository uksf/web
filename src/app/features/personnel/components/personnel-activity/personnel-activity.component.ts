import { Component } from '@angular/core';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MaintenanceComponent } from '../../../../shared/components/elements/maintenance/maintenance.component';

@Component({
    selector: 'app-personnel-activity',
    templateUrl: './personnel-activity.component.html',
    styleUrls: ['../personnel-page/personnel-page.component.scss', './personnel-activity.component.scss'],
    imports: [DefaultContentAreasComponent, MainContentAreaComponent, MaintenanceComponent]
})
export class PersonnelActivityComponent {}
