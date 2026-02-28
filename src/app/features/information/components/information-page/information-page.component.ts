import { Component } from '@angular/core';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatCard } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-information-page',
    templateUrl: './information-page.component.html',
    styleUrls: ['./information-page.component.scss', './information-page.component.scss-theme.scss'],
    imports: [DefaultContentAreasComponent, MainContentAreaComponent, MatCard, RouterLink, MatIcon]
})
export class InformationPageComponent {
    constructor() {}
}
