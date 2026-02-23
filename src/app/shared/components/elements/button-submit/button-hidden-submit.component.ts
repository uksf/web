import { Component } from '@angular/core';

@Component({
    selector: 'app-button-hidden-submit',
    template: '<button type="submit" style="display: none;"></button>',
    standalone: false
})
export class ButtonHiddenSubmitComponent {
    constructor() {}
}
