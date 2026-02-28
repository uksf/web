import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-about-page',
    templateUrl: './about-page.component.html',
    styleUrls: ['./about-page.component.scss', './about-page.component.scss-theme.scss'],
    imports: [RouterLink]
})
export class AboutPageComponent {
    constructor() {}
}
