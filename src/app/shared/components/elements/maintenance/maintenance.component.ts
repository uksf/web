import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CentreWrapperComponent } from '../centre-wrapper/centre-wrapper.component';
import { MatCard } from '@angular/material/card';

@Component({
    selector: 'app-maintenance',
    templateUrl: './maintenance.component.html',
    imports: [CentreWrapperComponent, MatCard]
})
export class MaintenanceComponent implements AfterViewInit {
    @ViewChild('maintenance', { read: ElementRef }) maintenance: ElementRef;

    constructor() {}

    ngAfterViewInit() {
        if (this.maintenance.nativeElement.parentElement.parentElement.children.length > 2) {
            for (let index = 1; index < this.maintenance.nativeElement.parentElement.parentElement.children.length; index++) {
                const element = this.maintenance.nativeElement.parentElement.parentElement.children[index];
                element.remove();
            }
        }
    }
}
