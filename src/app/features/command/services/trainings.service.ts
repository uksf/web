import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { Training } from '@app/features/command/models/training';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable()
export class TrainingsService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getTrainings(): Observable<Training[]> {
        return this.httpClient.get<Training[]>(`${this.urls.apiUrl}/trainings`);
    }

    checkUnique(value: string): Observable<boolean> {
        return this.httpClient.get<boolean>(`${this.urls.apiUrl}/trainings/check-unique?check=${value}`);
    }

    addTraining(formJson: string): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/trainings`, formJson, { headers: jsonHeaders });
    }

    editTraining(training: Training): Observable<Training[]> {
        return this.httpClient.patch<Training[]>(`${this.urls.apiUrl}/trainings`, training, { headers: jsonHeaders });
    }

    deleteTraining(trainingId: string): Observable<Training[]> {
        return this.httpClient.delete<Training[]>(`${this.urls.apiUrl}/trainings/${trainingId}`);
    }

    updateAccountTrainings(accountId: string, trainingIds: string[]): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/accounts/${accountId}/training`, trainingIds, { headers: jsonHeaders });
    }
}
