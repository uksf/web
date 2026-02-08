import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { VariableItem } from '@app/features/admin/models/variable-item';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable()
export class VariablesService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getVariables(): Observable<VariableItem[]> {
        return this.httpClient.get<VariableItem[]>(`${this.urls.apiUrl}/variables`);
    }

    addVariable(formJson: string): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/variables`, formJson, { headers: jsonHeaders });
    }

    checkVariableKey(key: string): Observable<boolean> {
        return this.httpClient.post<boolean>(`${this.urls.apiUrl}/variables/${key}`, {});
    }

    editVariable(variable: VariableItem): Observable<unknown> {
        return this.httpClient.patch(`${this.urls.apiUrl}/variables`, variable, { headers: jsonHeaders });
    }

    deleteVariable(key: string): Observable<unknown> {
        return this.httpClient.delete(`${this.urls.apiUrl}/variables/${key}`);
    }
}
