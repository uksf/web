import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AppComponent } from 'app/app.component';

@Component({
    selector: 'app-theme-emitter',
    templateUrl: './theme-emitter.component.html',
    styleUrls: ['./theme-emitter.component.css']
})
export class ThemeEmitterComponent implements AfterViewInit {
    @ViewChild('foreground', {static: false}) foregroundElement: ElementRef;
    @ViewChild('primary', {static: false}) primaryElement: ElementRef;
    @ViewChild('primaryContrast', {static: false}) primaryContrastElement: ElementRef;
    @ViewChild('accent', {static: false}) accentElement: ElementRef;
    @ViewChild('warn', {static: false}) warnElement: ElementRef;
    foregroundColor: string;
    primaryColor: string;
    primaryContrastColor: string;
    accentColor: string;
    warnColor: string;

    constructor() {
        AppComponent.themeUpdatedEvent.subscribe(() => {
            setTimeout(() => { this.ngAfterViewInit(); }, 1);
        })
    }

    ngAfterViewInit() {
        this.foregroundColor = getComputedStyle(this.foregroundElement.nativeElement).color;
        this.primaryColor = getComputedStyle(this.primaryElement.nativeElement).color;
        this.primaryContrastColor = getComputedStyle(this.primaryContrastElement.nativeElement).color;
        this.accentColor = getComputedStyle(this.accentElement.nativeElement).color;
        this.warnColor = getComputedStyle(this.primaryElement.nativeElement).color;
    }
}
