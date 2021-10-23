import { Component, ContentChild, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { UploadEvent, UploadFile } from '../../../Services/fileUploadTypes.service';
import type { IDropdownElement } from '../dropdown-base/dropdown-base.component';

@Component({
    selector: 'app-loading-placeholder',
    templateUrl: './loading-placeholder.component.html',
    styleUrls: ['./loading-placeholder.component.css']
})
export class LoadingPlaceholderComponent {
    @Input('width') width: number = 64;
    @Input('height') height: number = 16;
    @Input('loading') loading: boolean = true;
    @ContentChild('element', { static: false }) elementTemplateRef: TemplateRef<any>;

    constructor() {}
}
