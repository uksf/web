import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
    selector: 'app-maintenance',
    templateUrl: './maintenance.component.html'
})
export class MaintenanceComponent {
    @ViewChild('maintenance', { read: ElementRef, static: false }) maintenance: ElementRef;

    constructor() { }

    ngAfterViewInit() {
        if (this.maintenance.nativeElement.parentElement.parentElement.children.length > 2) {
            for (let index = 1; index < this.maintenance.nativeElement.parentElement.parentElement.children.length; index++) {
                const element = this.maintenance.nativeElement.parentElement.parentElement.children[index];
                element.remove();
            }
        }
    }
}
