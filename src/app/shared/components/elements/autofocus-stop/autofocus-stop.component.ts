import { Component } from '@angular/core';

@Component({
    selector: 'app-autofocus-stop',
    template: '<div style="max-width: 0; max-height: 0; overflow: hidden;"><input autofocus /></div>',
})
export class AutofocusStopComponent {
    constructor() {}
}
