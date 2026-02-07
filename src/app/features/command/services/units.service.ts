import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { RequestUnitUpdateOrder, RequestUnitUpdateParent, ResponseUnit, Unit, UnitTreeDataSet } from '@app/features/units/models/units';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable()
export class UnitsService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getUnitTree(): Observable<UnitTreeDataSet> {
        return this.httpClient.get<UnitTreeDataSet>(`${this.urls.apiUrl}/units/tree`);
    }

    getUnit(id: string): Observable<ResponseUnit> {
        return this.httpClient.get<ResponseUnit>(`${this.urls.apiUrl}/units/${id}`);
    }

    getUnits(filter?: string, accountId?: string): Observable<Unit[]> {
        let url = `${this.urls.apiUrl}/units`;
        const params: string[] = [];
        if (filter) { params.push(`filter=${filter}`); }
        if (accountId) { params.push(`accountId=${accountId}`); }
        if (params.length > 0) { url += `?${params.join('&')}`; }
        return this.httpClient.get<Unit[]>(url);
    }

    getAllUnits(): Observable<ResponseUnit[]> {
        return this.httpClient.get<ResponseUnit[]>(`${this.urls.apiUrl}/units`);
    }

    checkUnitExists(value: string, editId?: string): Observable<boolean> {
        let url = `${this.urls.apiUrl}/units/exists/${value}`;
        if (editId) { url += `?id=${editId}`; }
        return this.httpClient.get<boolean>(url);
    }

    createUnit(formJson: string): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/units`, formJson, { headers: jsonHeaders });
    }

    updateUnit(id: string, unit: ResponseUnit): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/units/${id}`, unit, { headers: jsonHeaders });
    }

    deleteUnit(id: string): Observable<unknown> {
        return this.httpClient.delete(`${this.urls.apiUrl}/units/${id}`);
    }

    updateParent(unitId: string, body: RequestUnitUpdateParent): Observable<unknown> {
        return this.httpClient.patch(`${this.urls.apiUrl}/units/${unitId}/parent`, body);
    }

    updateOrder(unitId: string, body: RequestUnitUpdateOrder): Observable<unknown> {
        return this.httpClient.patch(`${this.urls.apiUrl}/units/${unitId}/order`, body);
    }
}
