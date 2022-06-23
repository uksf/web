import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { AppComponent } from 'app/app.component';

@Component({
    selector: 'app-theme-emitter',
    templateUrl: './theme-emitter.component.html',
    styleUrls: ['./theme-emitter.component.css']
})
export class ThemeEmitterComponent implements AfterViewInit {
    @ViewChild('foreground') foregroundElement: ElementRef;
    @ViewChild('primary') primaryElement: ElementRef;
    @ViewChild('primaryContrast') primaryContrastElement: ElementRef;
    @ViewChild('accent') accentElement: ElementRef;
    @ViewChild('warn') warnElement: ElementRef;
    @ViewChild('warnContrast') warnContrastElement: ElementRef;
    foregroundColor: string;
    primaryColor: string;
    primaryContrastColor: string;
    accentColor: string;
    warnColor: string;
    warnContrastColor: string;

    constructor() {
        AppComponent.themeUpdatedEvent.subscribe(() => {
            setTimeout(() => {
                this.ngAfterViewInit();
            }, 1);
        });
    }

    ngAfterViewInit() {
        this.foregroundColor = getComputedStyle(this.foregroundElement.nativeElement).color;
        this.primaryColor = getComputedStyle(this.primaryElement.nativeElement).color;
        this.primaryContrastColor = getComputedStyle(this.primaryContrastElement.nativeElement).color;
        this.accentColor = getComputedStyle(this.accentElement.nativeElement).color;
        this.warnColor = getComputedStyle(this.primaryElement.nativeElement).color;
        this.warnContrastColor = getComputedStyle(this.warnContrastElement.nativeElement).color;
    }
}
