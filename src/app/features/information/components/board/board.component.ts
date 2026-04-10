import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { first, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxPermissionsModule } from 'ngx-permissions';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { DestroyableComponent } from '@app/shared/components';
import { HubConnectionFactory } from '@app/core/services/hub-connection-factory';
import { HubConnectionHandle } from '@app/core/services/hub-connection-handle';
import { BoardService } from '../../services/board.service';
import { Board, BoardCard, BoardColumn, BoardColumnKey, MoveCardRequest } from '../../models/board';
import { BoardColumnComponent } from '../board-column/board-column.component';
import { BoardCardDetailModalComponent } from '../../modals/board-card-detail-modal/board-card-detail-modal.component';
import { BoardSettingsModalComponent } from '../../modals/board-settings-modal/board-settings-modal.component';

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
    imports: [
        MatButton, MatIconButton, MatIcon, MatTooltip, TextInputComponent,
        NgxPermissionsModule, CdkDropListGroup, BoardColumnComponent, FormsModule
    ]
})
export class BoardComponent extends DestroyableComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private boardService = inject(BoardService);
    private hubFactory = inject(HubConnectionFactory);
    private dialog = inject(MatDialog);

    board: Board;
    boardId: string;
    accessDenied = false;
    allDropLists: string[] = [];
    newCardTitle = '';

    private hubConnection: HubConnectionHandle;

    private onBoardChanged = () => this.loadBoard();
    private onBoardUpdated = (data: Partial<Board>) => {
        if (data.name) this.board.name = data.name;
        if (data.labels) this.board.labels = data.labels;
        if (data.members) this.board.members = data.members;
        if (data.permissions) this.board.permissions = data.permissions;
    };

    ngOnInit() {
        this.boardId = this.route.snapshot.paramMap.get('boardId');
        this.loadBoard(() => this.openCardFromQueryParam());
        this.setupHub();
    }

    override ngOnDestroy() {
        super.ngOnDestroy();
        this.hubConnection?.disconnect();
    }

    private setupHub() {
        this.hubConnection = this.hubFactory.connect(`board?boardId=${this.boardId}`);
        this.hubConnection.on('ReceiveCardMoved', this.onBoardChanged);
        this.hubConnection.on('ReceiveCardCreated', this.onBoardChanged);
        this.hubConnection.on('ReceiveCardUpdated', this.onBoardChanged);
        this.hubConnection.on('ReceiveCardDeleted', this.onBoardChanged);
        this.hubConnection.on('ReceiveBoardUpdated', this.onBoardUpdated);
        this.hubConnection.reconnected$.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this.loadBoard()
        });
    }

    private loadBoard(callback?: () => void) {
        this.boardService.getBoard(this.boardId).pipe(first()).subscribe({
            next: (board) => {
                this.board = board;
                this.allDropLists = board.columns.map(c => `column-${c.key}`);
                this.accessDenied = false;
                callback?.();
            },
            error: (err) => {
                if (err.status === 403 || err.status === 401) {
                    this.accessDenied = true;
                }
            }
        });
    }

    onDrop(event: CdkDragDrop<BoardColumn>) {
        const card: BoardCard = event.item.data;
        const sourceColumn = event.previousContainer.data;
        const targetColumn = event.container.data;

        if (event.previousContainer === event.container) {
            moveItemInArray(targetColumn.cards, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(sourceColumn.cards, targetColumn.cards, event.previousIndex, event.currentIndex);
            sourceColumn.totalCards--;
            targetColumn.totalCards++;
        }

        const request: MoveCardRequest = {
            targetColumn: targetColumn.key,
            targetIndex: event.currentIndex
        };

        this.boardService.moveCard(this.boardId, card.id, request).pipe(first()).subscribe({
            error: () => this.loadBoard()
        });
    }

    openCard(card: BoardCard) {
        this.router.navigate([], { queryParams: { card: card.id }, queryParamsHandling: 'merge' });

        this.dialog.open(BoardCardDetailModalComponent, {
            data: { boardId: this.boardId, card, board: this.board },
            width: '900px',
            maxWidth: '95vw'
        })
        .afterClosed()
        .pipe(first())
        .subscribe({
            next: (updated) => {
                this.router.navigate([], { queryParams: { card: null }, queryParamsHandling: 'merge' });
                if (updated) {
                    this.loadBoard();
                }
            }
        });
    }

    onNewCardKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.createCard();
        }
    }

    private openCardFromQueryParam() {
        const cardId = this.route.snapshot.queryParamMap.get('card');
        if (!cardId || !this.board) return;

        for (const column of this.board.columns) {
            const card = column.cards.find(c => c.id === cardId);
            if (card) {
                this.openCard(card);
                return;
            }
        }
    }

    createCard() {
        if (!this.newCardTitle.trim()) return;
        this.boardService.createCard(this.boardId, { title: this.newCardTitle.trim() }).pipe(first()).subscribe({
            next: () => this.newCardTitle = ''
        });
    }

    openSettings() {
        this.dialog.open(BoardSettingsModalComponent, { data: { mode: 'edit', boardId: this.boardId } })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.loadBoard();
                    }
                }
            });
    }

    goBack() {
        this.router.navigate(['/information/boards']);
    }

    loadMoreDone() {
        const doneColumn = this.board.columns.find(c => c.key === BoardColumnKey.Done);
        if (!doneColumn) return;
        this.boardService.getDoneCards(this.boardId, doneColumn.cards.length).pipe(first()).subscribe({
            next: (cards) => doneColumn.cards.push(...cards)
        });
    }
}
