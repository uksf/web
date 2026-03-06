import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { first } from 'rxjs/operators';

export const VISITOR_ID_KEY = 'uksf_visitor_id';

@Injectable()
export class ApplicationAnalyticsService {
    private http = inject(HttpClient);
    private urls = inject(UrlService);

    trackEvent(event: string, value?: number): void {
        const visitorId = this.getOrCreateVisitorId();
        this.http
            .post(`${this.urls.apiUrl}/application/analytics/event`, { visitorId, event, value })
            .pipe(first())
            .subscribe({ error: () => {} });
    }

    private getOrCreateVisitorId(): string {
        const existing = localStorage.getItem(VISITOR_ID_KEY);
        if (existing) {
            return existing;
        }

        const id = crypto.randomUUID();
        localStorage.setItem(VISITOR_ID_KEY, id);
        return id;
    }
}
