import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnDestroy,
    Output,
    Renderer2,
    ViewChild
} from '@angular/core';
import {Subscription, timer} from 'rxjs';
import {UploadEvent, UploadFile} from '@app/shared/services/file-upload-types.service';

@Component({
    selector: 'app-file-drop',
    templateUrl: './file-drop.component.html',
    styleUrls: ['./file-drop.component.scss']
})
export class FileDropComponent implements OnDestroy {
    @ViewChild('dropZone') dropZone: ElementRef;
    @Input() headertext = '';
    @Input() customstyle = null;
    @Input() disableIf = false;
    @Output() onFileDrop = new EventEmitter();
    @Output() onFileOver = new EventEmitter();
    @Output() onFileLeave = new EventEmitter();
    stack = [];
    files = [];
    subscription: Subscription;
    dragoverflag = false;
    globalDisable = false;
    numOfActiveReadEntries = 0;
    globalStart = this.renderer.listen('document', 'dragstart', () => {
        this.globalDisable = true;
    });
    globalEnd = this.renderer.listen('document', 'dragend', () => {
        this.globalDisable = false;
    });

    constructor(private zone: NgZone, private renderer: Renderer2) {}

    onDragOver(event) {
        if (!this.globalDisable && !this.disableIf) {
            if (!this.dragoverflag && this.isDragSourceExternalFile(event.dataTransfer)) {
                const rect: DOMRect = this.dropZone.nativeElement.getBoundingClientRect();
                if (event.x >= rect.left && event.x <= rect.right && event.y >= rect.top && event.y <= rect.bottom) {
                    this.dragoverflag = true;
                    this.onFileOver.emit(event);
                }
            }
            this.preventAndStop(event);
        }
    }

    onDragLeave(event) {
        if (!this.globalDisable && !this.disableIf) {
            if (this.dragoverflag) {
                const rect: DOMRect = this.dropZone.nativeElement.getBoundingClientRect();
                if (event.x < rect.left || event.x > rect.right || event.y < rect.top || event.y > rect.bottom) {
                    this.dragoverflag = false;
                    this.onFileLeave.emit(event);
                }
            }
            this.preventAndStop(event);
        }
    }

    isDragSourceExternalFile(dataTransfer) {
        if (typeof DOMStringList !== 'undefined') {
            const dragDataType = dataTransfer.types;
            if (dragDataType.constructor === DOMStringList) {
                return dragDataType.contains('Files');
            }
        }
        if (typeof Array !== 'undefined') {
            const dragDataType = dataTransfer.types;
            if (dragDataType.constructor === Array) {
                return dragDataType.indexOf('Files') !== -1;
            }
        }
    }

    dropFiles(event) {
        if (!this.globalDisable && !this.disableIf) {
            this.dragoverflag = false;
            event.dataTransfer.dropEffect = 'copy';
            let length;
            if (event.dataTransfer.items) {
                length = event.dataTransfer.items.length;
            } else {
                length = event.dataTransfer.files.length;
            }
            const loop = (i) => {
                let entry = void 0;
                if (event.dataTransfer.items) {
                    if (event.dataTransfer.items[i].webkitGetAsEntry) {
                        entry = event.dataTransfer.items[i].webkitGetAsEntry();
                    }
                } else {
                    if (event.dataTransfer.files[i].webkitGetAsEntry) {
                        entry = event.dataTransfer.files[i].webkitGetAsEntry();
                    }
                }
                if (!entry) {
                    const file = event.dataTransfer.files[i];
                    if (file) {
                        const fakeFileEntry = {
                            name: file.name,
                            isDirectory: false,
                            isFile: true,
                            file: (callback) => {
                                callback(file);
                            },
                        };
                        const toUpload = new UploadFile(fakeFileEntry.name, fakeFileEntry);
                        this.addToQueue(toUpload);
                    }
                } else {
                    if (entry.isFile) {
                        const toUpload = new UploadFile(entry.name, entry);
                        this.addToQueue(toUpload);
                    } else if (entry.isDirectory) {
                        this.traverseFileTree(entry, entry.name);
                    }
                }
            };
            for (let i = 0; i < length; i++) {
                loop(i);
            }
            this.preventAndStop(event);
            const timerObservable = timer(200, 200);
            this.subscription = timerObservable.subscribe({
                next: () => {
                    if (this.files.length > 0 && this.numOfActiveReadEntries === 0) {
                        this.onFileDrop.emit(new UploadEvent(this.files));
                        this.files = [];
                    }
                }
            });
        }
    }

    traverseFileTree(item, path) {
        if (item.isFile) {
            const toUpload = new UploadFile(path, item);
            this.files.push(toUpload);
            this.zone.run(() => {
                this.popToStack();
            });
        } else {
            this.pushToStack(path);
            path = path + '/';
            const dirReader = item.createReader();
            let entries = [];
            const readEntries = () => {
                this.numOfActiveReadEntries++;
                dirReader.readEntries((res) => {
                    if (!res.length) {
                        if (entries.length === 0) {
                            const toUpload = new UploadFile(path, item);
                            this.zone.run(() => {
                                this.addToQueue(toUpload);
                            });
                        } else {
                            const loop = (i) => {
                                this.zone.run(() => {
                                    this.traverseFileTree(entries[i], path + entries[i].name);
                                });
                            };
                            for (let i = 0; i < entries.length; i++) {
                                loop(i);
                            }
                        }
                        this.zone.run(() => {
                            this.popToStack();
                        });
                    } else {
                        entries = entries.concat(res);
                        readEntries();
                    }
                    this.numOfActiveReadEntries--;
                });
            };
            readEntries();
        }
    }

    addToQueue(item) {
        this.files.push(item);
    }

    pushToStack(str) {
        this.stack.push(str);
    }

    popToStack() {
        return this.stack.pop();
    }

    clearQueue() {
        this.files = [];
    }

    preventAndStop(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.globalStart();
        this.globalEnd();
    }
}
