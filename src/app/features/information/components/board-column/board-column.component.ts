import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { BoardCard, BoardColumn, BoardColumnKey } from '../../models/board';
import { BoardCardComponent } from '../board-card/board-card.component';

@Component({
    selector: 'app-board-column',
    templateUrl: './board-column.component.html',
    styleUrls: ['./board-column.component.scss'],
    imports: [CdkDropList, CdkDrag, MatButton, MatIcon, BoardCardComponent]
})
export class BoardColumnComponent {
    @Input() column: BoardColumn;
    @Input() boardId: string;
    @Input() allDropLists: string[] = [];
    @Output() openCard = new EventEmitter<BoardCard>();
    @Output() loadMore = new EventEmitter<void>();
    @Output() dropped = new EventEmitter<CdkDragDrop<BoardColumn>>();

    get dropListId(): string {
        return `column-${this.column.key}`;
    }

    get connectedLists(): string[] {
        return this.allDropLists.filter(id => id !== this.dropListId);
    }

    get showLoadMore(): boolean {
        return this.column.key === BoardColumnKey.Done && this.column.cards.length < this.column.totalCards;
    }

    onOpenCard(card: BoardCard) {
        this.openCard.emit(card);
    }

    onLoadMore() {
        this.loadMore.emit();
    }

}
