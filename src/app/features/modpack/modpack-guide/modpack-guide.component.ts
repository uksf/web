import { Component } from '@angular/core';
import { DefaultContentAreasComponent } from '../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '../../../shared/components/content-areas/full-content-area/full-content-area.component';
import { ModpackPageComponent } from '../modpack-page/modpack-page.component';
import { MatCard } from '@angular/material/card';

@Component({
    selector: 'app-modpack-guide',
    templateUrl: './modpack-guide.component.html',
    styleUrls: ['../modpack-page/modpack-page.component.scss', './modpack-guide.component.scss', './modpack-guide.component.scss-theme.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, ModpackPageComponent, MatCard]
})
export class ModpackGuideComponent {
    constructor() {}
}
