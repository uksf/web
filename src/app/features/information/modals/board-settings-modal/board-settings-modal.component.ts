import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatCheckbox } from '@angular/material/checkbox';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { AutofocusStopComponent } from '@app/shared/components/elements/autofocus-stop/autofocus-stop.component';
import { FlexFillerComponent } from '@app/shared/components/elements/flex-filler/flex-filler.component';
import { SelectionListComponent } from '@app/shared/components/elements/selection-list/selection-list.component';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { UnitsService } from '@app/features/command/services/units.service';
import { MembersService } from '@app/shared/services/members.service';
import { BoardService } from '../../services/board.service';
import { Board, BoardPermissions } from '../../models/board';

export interface BoardSettingsModalData {
    mode: 'create' | 'edit';
    boardId?: string;
}

@Component({
    selector: 'app-board-settings-modal',
    templateUrl: './board-settings-modal.component.html',
    styleUrls: ['./board-settings-modal.component.scss'],
    imports: [
        AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions, MatButton,
        FlexFillerComponent, MatFormField, MatLabel, MatInput, MatCheckbox, ReactiveFormsModule, FormsModule,
        SelectionListComponent
    ]
})
export class BoardSettingsModalComponent implements OnInit {
    private dialogRef = inject<MatDialogRef<BoardSettingsModalComponent>>(MatDialogRef);
    private data = inject<BoardSettingsModalData>(MAT_DIALOG_DATA);
    private boardService = inject(BoardService);
    private unitsService = inject(UnitsService);
    private membersService = inject(MembersService);
    private fb = inject(FormBuilder);

    mode: 'create' | 'edit';
    board: Board;

    form = this.fb.group({
        name: ['', Validators.required]
    });

    units = new BehaviorSubject<IDropdownElement[]>([]);
    members = new BehaviorSubject<IDropdownElement[]>([]);
    selectedUnits: IDropdownElement[] = [];
    selectedMembers: IDropdownElement[] = [];
    expandToSubUnits = true;

    ngOnInit() {
        this.mode = this.data.mode;
        this.loadPermissionData();

        if (this.mode === 'edit' && this.data.boardId) {
            this.boardService.getBoard(this.data.boardId).pipe(first()).subscribe({
                next: (board) => {
                    this.board = board;
                    this.form.patchValue({ name: board.name });
                    this.expandToSubUnits = board.permissions.expandToSubUnits;
                    this.preSelectPermissions(board);
                }
            });
        }
    }

    save() {
        if (this.form.invalid) return;

        const permissions: BoardPermissions = {
            units: this.selectedUnits.map(u => u.value),
            members: this.selectedMembers.map(m => m.value),
            expandToSubUnits: this.expandToSubUnits
        };

        if (this.mode === 'create') {
            this.boardService.createBoard({ name: this.form.value.name, permissions }).pipe(first()).subscribe({
                next: () => this.dialogRef.close(true)
            });
        } else {
            this.boardService.updateBoard(this.data.boardId, {
                name: this.form.value.name,
                permissions,
                labels: this.board?.labels ?? []
            }).pipe(first()).subscribe({
                next: () => this.dialogRef.close(true)
            });
        }
    }

    cancel() {
        this.dialogRef.close(false);
    }

    private loadPermissionData() {
        forkJoin([
            this.unitsService.getAllUnits(),
            this.membersService.getMembers()
        ]).pipe(first()).subscribe({
            next: ([units, members]) => {
                this.units.next(units.map(u => ({ value: u.id, displayValue: u.name })));
                this.members.next(members.map(m => ({ value: m.id, displayValue: m.displayName })));

                if (this.board) {
                    this.preSelectPermissions(this.board);
                }
            }
        });
    }

    private preSelectPermissions(board: Board) {
        const allUnits = this.units.getValue();
        const allMembers = this.members.getValue();

        if (allUnits.length > 0) {
            this.selectedUnits = board.permissions.units.map(id => {
                const unit = allUnits.find(u => u.value === id);
                return unit || { value: id, displayValue: id };
            });
        }

        if (allMembers.length > 0) {
            this.selectedMembers = board.permissions.members.map(id => {
                const member = allMembers.find(m => m.value === id);
                return member || { value: id, displayValue: id };
            });
        }
    }
}
