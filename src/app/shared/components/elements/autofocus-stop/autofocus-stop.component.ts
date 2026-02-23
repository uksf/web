import { Component } from '@angular/core';

@Component({
    selector: 'app-autofocus-stop',
    template: '<div style="max-width: 0; max-height: 0; overflow: hidden;"><input autofocus /></div>',
    standalone: false
})
export class AutofocusStopComponent {
    constructor() {}
}
