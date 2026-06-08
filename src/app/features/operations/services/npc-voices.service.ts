import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { NpcVoice, NpcVoiceJob } from '../models/npc-voice';

@Injectable()
export class NpcVoicesService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    getVoices(): Observable<NpcVoice[]> {
        return this.httpClient.get<NpcVoice[]>(`${this.urls.apiUrl}/npcvoices`);
    }

    upload(formData: FormData): Observable<NpcVoice> {
        return this.httpClient.post<NpcVoice>(`${this.urls.apiUrl}/npcvoices`, formData);
    }

    delete(id: string): Observable<unknown> {
        return this.httpClient.delete(`${this.urls.apiUrl}/npcvoices/${id}`);
    }

    sampleUrl(id: string): string {
        return `${this.urls.apiUrl}/npcvoices/${id}/sample`;
    }

    generateMoods(baseVoiceId: string): Observable<NpcVoiceJob> {
        return this.httpClient.post<NpcVoiceJob>(`${this.urls.apiUrl}/npcvoices/${baseVoiceId}/generate-moods`, {});
    }

    getJob(baseVoiceId: string): Observable<NpcVoiceJob> {
        return this.httpClient.get<NpcVoiceJob>(`${this.urls.apiUrl}/npcvoices/${baseVoiceId}/job`);
    }
}
