import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss'],
    imports: [MatButton, MatProgressSpinner]
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
