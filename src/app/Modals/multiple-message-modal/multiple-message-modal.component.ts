import { Component, Inject, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-multiple-message-modal',
    templateUrl: './multiple-message-modal.component.html',
    styleUrls: ['./multiple-message-modal.component.css']
})
export class MultipleMessageModalComponent {
    @ViewChild('messageBox') messageBox: ElementRef;
    messages;
    title;
    message;
    index = 0;
    private minWidth = 0;
    private minHeight = 0;

    constructor(public dialog: MatDialogRef<MultipleMessageModalComponent>, public renderer: Renderer2, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.title = data.title;
        this.messages = data.messages;
        this.message = this.messages[0];
    }

    ngAfterViewChecked(): void {
        this.checkSize();
    }

    next() {
        this.index++;
        if (this.index >= this.messages.length) {
            this.index = 0;
        }
        this.message = this.messages[this.index];
        this.checkSize();
    }

    previous() {
        this.index--;
        if (this.index < 0) {
            this.index = this.messages.length - 1;
        }
        this.message = this.messages[this.index];
        this.checkSize();
    }

    checkSize() {
        if (this.messageBox.nativeElement.offsetWidth > this.minWidth) {
            this.minWidth = this.messageBox.nativeElement.offsetWidth;
            this.renderer.setStyle(this.messageBox.nativeElement, 'width', `${this.minWidth}px`);
        }
        if (this.messageBox.nativeElement.offsetHeight > this.minHeight) {
            this.minHeight = this.messageBox.nativeElement.offsetHeight;
            this.renderer.setStyle(this.messageBox.nativeElement, 'height', `${this.minHeight}px`);
        }
    }
}

