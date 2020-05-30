import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-about-page',
    templateUrl: './about-page.component.html',
    styleUrls: ['./about-page.component.scss', '/about-page.component.scss-theme.scss']
})
export class AboutPageComponent {
    @Input() showRoute = true;

    constructor() { }
}
