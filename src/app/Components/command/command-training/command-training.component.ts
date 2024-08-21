import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { Observable, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Training } from '../../../Models/Training';
import { AddTrainingModalComponent } from '../../../Modals/command/add-training-modal/add-training-modal.component';

@Component({
    selector: 'app-command-training',
    templateUrl: './command-training.component.html',
    styleUrls: ['../../../Pages/command-page/command-page.component.scss', './command-training.component.scss']
})
export class CommandTrainingComponent implements OnInit {
    trainings: Training[];

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {}

    ngOnInit() {
        this.getTrainings();
    }

    validateInlineTraining(value): Observable<boolean> {
        return timer(200).pipe(
            switchMap((): Observable<boolean> => {
                return this.httpClient
                    .get(`${this.urls.apiUrl}/trainings/check-unique?check=${value}`, {
                        headers: new HttpHeaders({
                            'Content-Type': 'application/json'
                        })
                    })
                    .pipe(map((response: boolean): boolean => response));
            })
        );
    }

    getTrainings() {
        this.httpClient.get(`${this.urls.apiUrl}/trainings`).subscribe((response: Training[]) => {
            this.trainings = response;
        });
    }

    addTraining() {
        this.dialog
            .open(AddTrainingModalComponent, {})
            .afterClosed()
            .subscribe((_) => {
                this.getTrainings();
            });
    }

    editTraining(check: string) {
        const training: Training = this.trainings.find((x: Training): boolean => x.name === check || x.shortName === check || x.teamspeakGroup === check);
        if (training) {
            this.httpClient
                .patch(`${this.urls.apiUrl}/ranks`, training, {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json'
                    })
                })
                .subscribe((response: Training[]): void => {
                    this.trainings = response;
                });
        }
    }

    deleteTraining(event, training) {
        event.stopPropagation();
        const dialog: MatDialogRef<ConfirmationModalComponent> = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${training.name}'?` }
        });
        dialog.componentInstance.confirmEvent.subscribe((): void => {
            this.httpClient.delete(`${this.urls.apiUrl}/trainings/${training.id}`).subscribe((response: Training[]): void => {
                this.trainings = response;
            });
        });
    }
}
