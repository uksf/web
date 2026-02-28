import { Component, OnInit } from '@angular/core';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { SideContentAreaComponent } from '../../../../shared/components/content-areas/side-content-area/side-content-area.component';
import { MatCard } from '@angular/material/card';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-policy-page',
    templateUrl: './policy-page.component.html',
    styleUrls: ['./policy-page.component.scss'],
    imports: [DefaultContentAreasComponent, SideContentAreaComponent, MatCard, MainContentAreaComponent, RouterLink]
})
export class PolicyPageComponent implements OnInit {
    constructor() {}

    ngOnInit() {}
}
