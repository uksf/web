import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { DischargeCollection } from '../components/personnel-discharges/personnel-discharges.component';

@Injectable()
export class DischargesService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    getDischarges(): Observable<DischargeCollection[]> {
        return this.httpClient.get<DischargeCollection[]>(`${this.urls.apiUrl}/discharges`);
    }

    reinstateDischarge(dischargeId: string): Observable<DischargeCollection[]> {
        return this.httpClient.get<DischargeCollection[]>(`${this.urls.apiUrl}/discharges/reinstate/${dischargeId}`);
    }
}
