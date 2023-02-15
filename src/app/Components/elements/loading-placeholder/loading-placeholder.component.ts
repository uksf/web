import { Component, ContentChild, Input, TemplateRef } from '@angular/core';

@Component({
    selector: 'app-loading-placeholder',
    templateUrl: './loading-placeholder.component.html',
    styleUrls: ['./loading-placeholder.component.scss']
})
export class LoadingPlaceholderComponent {
    @Input('width') width: string = '64px';
    @Input('height') height: string = '16px';
    @Input('loading') loading: boolean = true;
    @ContentChild('element', { static: false }) elementTemplateRef: TemplateRef<any>;

    constructor() {}
}
