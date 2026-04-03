import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatChipSet, MatChip } from '@angular/material/chips';
import { BoardCard } from '../../models/board';

@Component({
    selector: 'app-board-card',
    templateUrl: './board-card.component.html',
    styleUrls: ['./board-card.component.scss'],
    imports: [MatCard, MatChipSet, MatChip]
})
export class BoardCardComponent {
    @Input() card: BoardCard;
    @Output() openCard = new EventEmitter<BoardCard>();

    onClick() {
        this.openCard.emit(this.card);
    }
}
