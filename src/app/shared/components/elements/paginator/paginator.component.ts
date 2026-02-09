import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-paginator',
    templateUrl: './paginator.component.html',
    styleUrls: ['./paginator.component.scss']
})
export class PaginatorComponent implements OnChanges {
    @Output() page = new EventEmitter<PagedEvent>();
    @Input() total: number = 0;
    pageIndex: number = 0;
    pageSize: number = 15;
    pageSizes = [10, 15, 30, 50];

    constructor() {}

    ngOnChanges(changes: SimpleChanges): void {
        if (this.total > 0 && (this.pageIndex + 1) * this.pageSize > this.total) {
            this.pageIndex = Math.max(Math.ceil(this.total / this.pageSize) - 1, 0);

            this.page.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
        }
    }

    pageChange(change: number) {
        this.pageIndex += change;

        this.page.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
    }

    trackByIndex(index: number): number {
        return index;
    }

    min(a: number, b: number): number {
        return Math.min(a, b);
    }
}

export interface PagedEvent {
    pageIndex: number;
    pageSize: number;
}
