import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { AddRankModalComponent } from '../../../Modals/command/add-rank-modal/add-rank-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-command-ranks',
    templateUrl: './command-ranks.component.html',
    styleUrls: ['../../../Pages/command-page/command-page.component.scss', './command-ranks.component.scss']
})
export class CommandRanksComponent implements OnInit {
    ranks;
    updatingOrder = false;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {}

    ngOnInit() {
        this.getRanks();
    }

    validateInlineRank(rank): Observable<boolean> {
        return timer(200).pipe(
            switchMap(() => {
                return this.httpClient
                    .post(`${this.urls.apiUrl}/ranks`, rank, {
                        headers: new HttpHeaders({
                            'Content-Type': 'application/json'
                        })
                    })
                    .pipe(map((response) => (response ? true : false)));
            })
        );
    }

    getRanks() {
        this.httpClient.get(`${this.urls.apiUrl}/ranks`).subscribe((response) => {
            this.ranks = response;
        });
    }

    addRank() {
        this.dialog
            .open(AddRankModalComponent, {})
            .afterClosed()
            .subscribe((_) => {
                this.getRanks();
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
                .subscribe((response) => {
                    this.ranks = response;
                });
        }
    }

    deleteRank(event, rank) {
        event.stopPropagation();
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${rank.name}'?` }
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.httpClient.delete(`${this.urls.apiUrl}/ranks/${rank.id}`).subscribe((response) => {
                this.ranks = response;
            });
        });
    }

    onMove(event: CdkDragDrop<string[]>) {
        const before = JSON.stringify(this.ranks);
        moveItemInArray(this.ranks, event.previousIndex, event.currentIndex);
        if (before === JSON.stringify(this.ranks)) {
            return;
        }
        this.updatingOrder = true;
        this.httpClient.post(`${this.urls.apiUrl}/ranks/order`, this.ranks).subscribe((response) => {
            this.ranks = response;
            this.updatingOrder = false;
        });
    }

    onDragStarted(event) {
        event.source._dragRef._preview.classList.add('dark-theme');
        event.source.element.nativeElement.classList.add('dark-theme');
    }
}
