import { Component, HostListener, OnInit } from '@angular/core';

@Component({
    selector: 'app-footer-bar',
    templateUrl: './footer-bar.component.html',
    styleUrls: ['./footer-bar.component.scss'],
    standalone: false
})
export class FooterBarComponent implements OnInit {
    mobile = false;
    mobileSmall = false;

    constructor() {}

    ngOnInit() {
        this.mobile = window.screen.width <= 768 && window.screen.width > 375;
        this.mobileSmall = window.screen.width <= 375;
    }

    @HostListener('window:resize')
    onResize() {
        this.mobile = window.screen.width <= 768 && window.screen.width > 375;
        this.mobileSmall = window.screen.width <= 375;
    }

    getCurrentYear(): number {
        return new Date().getFullYear();
    }
}
