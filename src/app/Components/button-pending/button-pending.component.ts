import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-button-pending',
    templateUrl: './button-pending.component.html',
    styleUrls: ['./button-pending.component.scss'],
})
export class ButtonPendingComponent implements OnInit {
    @Input() pending = false;
    @Input() disabled = false;
    @Output() click = new EventEmitter();

    constructor() {}

    ngOnInit(): void {}

    onClick() {
        this.click.emit();
    }
}
