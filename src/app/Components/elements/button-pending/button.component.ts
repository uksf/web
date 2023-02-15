import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {
    @Input() pending = false;
    @Input() disabled = false;
    @Output() clicked = new EventEmitter();

    constructor() {}

    ngOnInit(): void {}

    onClick() {
        this.clicked.emit();
    }
}
