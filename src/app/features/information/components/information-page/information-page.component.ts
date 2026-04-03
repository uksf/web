import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '@app/shared/components/content-areas/main-content-area/main-content-area.component';

@Component({
    selector: 'app-information-page',
    templateUrl: './information-page.component.html',
    styleUrls: ['./information-page.component.scss', './information-page.component.scss-theme.scss'],
    imports: [DefaultContentAreasComponent, MainContentAreaComponent, MatCard, RouterLink, MatIcon]
})
export class InformationPageComponent {}
