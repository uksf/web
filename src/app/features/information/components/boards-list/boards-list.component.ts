import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { NgxPermissionsModule } from 'ngx-permissions';
import { ConfirmationModalComponent, ConfirmationModalData } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { SpotlightDirective } from '@app/shared/directives/spotlight.directive';
import { BoardService } from '../../services/board.service';
import { BoardListItem } from '../../models/board';
import { BoardSettingsModalComponent } from '../../modals/board-settings-modal/board-settings-modal.component';

@Component({
    selector: 'app-boards-list',
    templateUrl: './boards-list.component.html',
    styleUrls: ['./boards-list.component.scss', './boards-list.component.scss-theme.scss'],
    imports: [
        MatCard, MatIcon, MatButton, MatIconButton,
        MatTooltip, MatMenu, MatMenuItem, MatMenuTrigger, NgxPermissionsModule,
        SpotlightDirective
    ]
})
export class BoardsListComponent implements OnInit {
    private boardService = inject(BoardService);
    private dialog = inject(MatDialog);
    private router = inject(Router);

    boards: BoardListItem[] = [];

    ngOnInit() {
        this.loadBoards();
    }

    loadBoards() {
        this.boardService.getBoards().pipe(first()).subscribe({
            next: (boards) => this.boards = boards
        });
    }

    openBoard(board: BoardListItem) {
        this.router.navigate(['/information/boards', board.id]);
    }

    createBoard() {
        this.dialog.open(BoardSettingsModalComponent, { data: { mode: 'create' } })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.loadBoards();
                    }
                }
            });
    }

    editBoard(event: Event, board: BoardListItem) {
        event.stopPropagation();
        this.dialog.open(BoardSettingsModalComponent, { data: { mode: 'edit', boardId: board.id } })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.loadBoards();
                    }
                }
            });
    }

    deleteBoard(event: Event, board: BoardListItem) {
        event.stopPropagation();
        this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete "${board.name}"?`, button: 'Delete' } as ConfirmationModalData
        })
        .afterClosed()
        .pipe(first())
        .subscribe({
            next: (confirmed) => {
                if (confirmed) {
                    this.boardService.deleteBoard(board.id).pipe(first()).subscribe({
                        next: () => this.loadBoards()
                    });
                }
            }
        });
    }

}
