import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, timer } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Rank } from '@app/shared/models/rank';
import { AddRankModalComponent } from '@app/features/command/modals/add-rank-modal/add-rank-modal.component';
import { RanksService } from '../../services/ranks.service';

@Component({
    selector: 'app-command-ranks',
    templateUrl: './command-ranks.component.html',
    styleUrls: ['../command-page/command-page.component.scss', './command-ranks.component.scss']
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
        this.ranksService.getRanks().pipe(first()).subscribe({
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
            this.ranksService.editRank(rank).pipe(first()).subscribe({
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
        dialog.afterClosed().pipe(first()).subscribe({
            next: (result) => {
                if (result) {
                    this.ranksService.deleteRank(rank.id).pipe(first()).subscribe({
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
        this.ranksService.updateRankOrder(this.ranks).pipe(first()).subscribe({
            next: (response) => {
                this.ranks = response;
                this.updatingOrder = false;
            }
        });
    }

    trackByRankId(index: number, rank: { id: string }): string {
        return rank.id;
    }

    onDragStarted(event) {
        event.source._dragRef._preview.classList.add('dark-theme');
        event.source.element.nativeElement.classList.add('dark-theme');
    }
}
