import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatChipGrid, MatChipRow, MatChipRemove } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { DropdownComponent } from '@app/shared/components/elements/dropdown/dropdown.component';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { AutofocusStopComponent } from '@app/shared/components/elements/autofocus-stop/autofocus-stop.component';
import { FlexFillerComponent } from '@app/shared/components/elements/flex-filler/flex-filler.component';
import { CommentDisplayComponent } from '@app/shared/components/comment-display/comment-display.component';
import { TimeAgoPipe } from '@app/shared/pipes/time.pipe';
import { BoardService } from '../../services/board.service';
import { Board, BoardCard, UpdateCardRequest } from '../../models/board';

export interface BoardCardDetailModalData {
    boardId: string;
    card: BoardCard;
    board: Board;
}

@Component({
    selector: 'app-board-card-detail-modal',
    templateUrl: './board-card-detail-modal.component.html',
    styleUrls: ['./board-card-detail-modal.component.scss', './board-card-detail-modal.component.scss-theme.scss'],
    imports: [
        AutofocusStopComponent, MatDialogTitle, MatDialogContent, MatDialogActions, MatButton,
        FlexFillerComponent, MatChipGrid, MatChipRow, MatChipRemove, MatIcon, MatTooltip,
        MatTabGroup, MatTab, MatTabLabel, FormsModule, ReactiveFormsModule,
        TextInputComponent, DropdownComponent, CommentDisplayComponent, TimeAgoPipe, DatePipe
    ]
})
export class BoardCardDetailModalComponent implements OnInit {
    private dialogRef = inject<MatDialogRef<BoardCardDetailModalComponent>>(MatDialogRef);
    private data = inject<BoardCardDetailModalData>(MAT_DIALOG_DATA);
    private boardService = inject(BoardService);
    private fb = inject(FormBuilder);

    card: BoardCard;
    board: Board;
    boardId: string;
    commentThreadId: string;

    form = this.fb.group({
        title: ['', Validators.required],
        detail: ['']
    });

    memberElements$ = new BehaviorSubject<IDropdownElement[]>([]);
    labelElements$ = new BehaviorSubject<IDropdownElement[]>([]);
    selectedAssignee: IDropdownElement = null;

    labels: string[] = [];

    ngOnInit() {
        this.card = this.data.card;
        this.board = this.data.board;
        this.boardId = this.data.boardId;
        this.commentThreadId = this.card.commentThreadId;

        this.form.patchValue({
            title: this.card.title,
            detail: this.card.detail
        });

        const unassigned: IDropdownElement = { value: '', displayValue: 'Unassigned' };
        const elements: IDropdownElement[] = [
            unassigned,
            ...this.board.members.map(m => ({ value: m.id, displayValue: m.displayName }))
        ];
        this.memberElements$.next(elements);

        const assigneeId = this.card.assigneeId || '';
        this.selectedAssignee = elements.find(e => e.value === assigneeId) || unassigned;

        this.labels = [...this.card.labels];
        this.updateLabelElements();

        if (!this.commentThreadId) {
            this.boardService.ensureCommentThread(this.boardId, this.card.id).pipe(first()).subscribe({
                next: (threadId) => this.commentThreadId = threadId
            });
        }
    }

    onLabelSelected(element: IDropdownElement) {
        if (element) {
            this.addLabel(element.displayValue);
        }
    }

    addLabel(label: string) {
        const trimmed = label.trim();
        if (trimmed && !this.labels.includes(trimmed)) {
            this.labels.push(trimmed);
            this.updateLabelElements();
        }
    }

    removeLabel(label: string) {
        this.labels = this.labels.filter(l => l !== label);
        this.updateLabelElements();
    }

    private updateLabelElements() {
        const elements = this.board.labels
            .filter(l => !this.labels.includes(l))
            .map(l => ({ value: l, displayValue: l }));
        this.labelElements$.next(elements);
    }

    save() {
        if (this.form.invalid) return;

        const request: UpdateCardRequest = {
            title: this.form.value.title,
            detail: this.form.value.detail || '',
            labels: this.labels,
            assigneeId: this.selectedAssignee?.value || null
        };

        this.boardService.updateCard(this.boardId, this.card.id, request).pipe(first()).subscribe({
            next: () => this.dialogRef.close(true)
        });
    }

    get reversedActivity() {
        return [...this.card.activity].reverse();
    }

    get hasChanges(): boolean {
        if (this.form.value.title !== this.card.title) return true;
        if ((this.form.value.detail || '') !== (this.card.detail || '')) return true;
        if ((this.selectedAssignee?.value || '') !== (this.card.assigneeId || '')) return true;
        const currentLabels = [...this.labels].sort();
        const originalLabels = [...this.card.labels].sort();
        if (currentLabels.length !== originalLabels.length) return true;
        return currentLabels.some((l, i) => l !== originalLabels[i]);
    }

    cancel() {
        this.dialogRef.close(false);
    }
}
