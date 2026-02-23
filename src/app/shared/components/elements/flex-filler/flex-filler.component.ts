import { Component } from '@angular/core';

@Component({
    selector: 'app-flex-filler',
    template: '',
    host: {
        '[style.flex]': '1',
    },
    standalone: false
})
export class FlexFillerComponent {
    constructor() {}
}
