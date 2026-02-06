import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { EditMemberTrainingModalData, EditTrainingItem, Training } from '@app/features/command/models/training';

@Component({
    selector: 'app-edit-member-training-modal',
    templateUrl: './edit-member-training-modal.component.html',
    styleUrls: ['./edit-member-training-modal.component.scss']
})
export class EditMemberTrainingModalComponent implements OnInit {
    accountId: string;
    name: string;
    trainings: Training[];
    availableTrainings: EditTrainingItem[];
    before: string;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: EditMemberTrainingModalData) {
        if (data) {
            this.accountId = data.accountId;
            this.name = data.name;
            this.trainings = data.trainings;
        }
    }

    get changes() {
        return JSON.stringify(this.availableTrainings) !== this.before;
    }

    ngOnInit() {
        this.httpClient.get(this.urls.apiUrl + `/trainings`).subscribe({
            next: (response: Training[]): void => {
                this.availableTrainings = response.map((training: Training): EditTrainingItem => {
                    return { ...training, selected: !!this.trainings.find((x: Training): boolean => x.id === training.id) };
                });
                this.before = JSON.stringify(this.availableTrainings);
            }
        });
    }

    save() {
        const trainingIds: string[] = this.availableTrainings.filter((training: EditTrainingItem): boolean => training.selected).map((training: EditTrainingItem): string => training.id);

        this.httpClient
            .put(`${this.urls.apiUrl}/accounts/${this.accountId}/training`, trainingIds, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
            .subscribe({
                next: (_) => {
                    this.dialog.closeAll();
                }
            });
    }
}
