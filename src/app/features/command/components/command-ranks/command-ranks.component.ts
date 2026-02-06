import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { AddRankModalComponent } from '@app/features/command/modals/add-rank-modal/add-rank-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, timer } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-command-ranks',
    templateUrl: './command-ranks.component.html',
    styleUrls: ['../command-page/command-page.component.scss', './command-ranks.component.scss']
})
export class CommandRanksComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    ranks;
    updatingOrder = false;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {}

    ngOnInit() {
        this.getRanks();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    validateInlineRank(rank): Observable<boolean> {
        return timer(200).pipe(
            switchMap(() => {
                return this.httpClient
                    .post(`${this.urls.apiUrl}/ranks/exists`, rank, {
                        headers: new HttpHeaders({
                            'Content-Type': 'application/json'
                        })
                    })
                    .pipe(map((response) => (response ? true : false)));
            })
        );
    }

    getRanks() {
        this.httpClient.get(`${this.urls.apiUrl}/ranks`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                this.ranks = response;
            }
        });
    }

    addRank() {
        this.dialog
            .open(AddRankModalComponent, {})
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (_) => {
                    this.getRanks();
                }
            });
    }

    editRank(check) {
        const rank = this.ranks.find((x) => x.name === check || x.abbreviation === check || x.teamspeakGroup === check || x.discordRoleId === check);
        if (rank) {
            this.httpClient
                .patch(`${this.urls.apiUrl}/ranks`, rank, {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json'
                    })
                })
                .pipe(takeUntil(this.destroy$))
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
        dialog.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
            next: (result) => {
                if (result) {
                    this.httpClient.delete(`${this.urls.apiUrl}/ranks/${rank.id}`).pipe(takeUntil(this.destroy$)).subscribe({
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
        this.httpClient.post(`${this.urls.apiUrl}/ranks/order`, this.ranks).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                this.ranks = response;
                this.updatingOrder = false;
            }
        });
    }

    trackByRankId(index: number, rank: any): string {
        return rank.id;
    }

    onDragStarted(event) {
        event.source._dragRef._preview.classList.add('dark-theme');
        event.source.element.nativeElement.classList.add('dark-theme');
    }
}
