import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, timer } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Rank } from '@app/shared/models/rank';
import { AddRankModalComponent } from '@app/features/command/modals/add-rank-modal/add-rank-modal.component';
import { RanksService } from '../../services/ranks.service';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { InlineEditComponent } from '../../../../shared/components/elements/inline-edit/inline-edit.component';
import { FormsModule } from '@angular/forms';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
    selector: 'app-command-ranks',
    templateUrl: './command-ranks.component.html',
    styleUrls: ['../command-page/command-page.component.scss', './command-ranks.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        MatProgressSpinner,
        NgxPermissionsModule,
        MatButton,
        CdkDropList,
        MatCard,
        CdkDrag,
        CdkDragHandle,
        InlineEditComponent,
        FormsModule,
        FlexFillerComponent,
        MatIcon,
        MatTooltip
    ]
})
export class CommandRanksComponent implements OnInit {
    ranks: Rank[];
    updatingOrder = false;

    constructor(private ranksService: RanksService, private dialog: MatDialog) {}

    ngOnInit() {
        this.getRanks();
    }

    validateInlineRank(rank: Rank): Observable<boolean> {
        return timer(200).pipe(
            switchMap(() => {
                return this.ranksService.checkRankExists(rank).pipe(map((response) => (response ? true : false)));
            })
        );
    }

    getRanks() {
        this.ranksService
            .getRanks()
            .pipe(first())
            .subscribe({
                next: (response) => {
                    this.ranks = response;
                }
            });
    }

    addRank() {
        this.dialog
            .open(AddRankModalComponent, {})
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (_) => {
                    this.getRanks();
                }
            });
    }

    editRank(check) {
        const rank = this.ranks.find((x) => x.name === check || x.abbreviation === check || x.teamspeakGroup === check || x.discordRoleId === check);
        if (rank) {
            this.ranksService
                .editRank(rank)
                .pipe(first())
                .subscribe({
                    next: (response) => {
                        this.ranks = response;
                    }
                });
        }
    }

    deleteRank(event, rank) {
        event.stopPropagation();
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${rank.name}'?` }
        });
        dialog
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.ranksService
                            .deleteRank(rank.id)
                            .pipe(first())
                            .subscribe({
                                next: (response) => {
                                    this.ranks = response;
                                }
                            });
                    }
                }
            });
    }

    onMove(event: CdkDragDrop<string[]>) {
        const before = JSON.stringify(this.ranks);
        moveItemInArray(this.ranks, event.previousIndex, event.currentIndex);
        if (before === JSON.stringify(this.ranks)) {
            return;
        }
        this.updatingOrder = true;
        this.ranksService
            .updateRankOrder(this.ranks)
            .pipe(first())
            .subscribe({
                next: (response) => {
                    this.ranks = response;
                    this.updatingOrder = false;
                }
            });
    }

    trackByRankId(index: number, rank: { id: string }): string {
        return rank.id;
    }
}
