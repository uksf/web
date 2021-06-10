import { Component } from '@angular/core';

@Component({
    selector: 'app-flex-filler',
    template: '',
    host: {
        '[style.flex]': '1',
    },
})
export class FlexFillerComponent {
    constructor() {}
}
