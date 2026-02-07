import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';

export interface Notification {
    id: string;
    icon: string;
    message: string;
    link: string;
    read: boolean;
    timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getNotifications(): Observable<Notification[]> {
        return this.httpClient.get<Notification[]>(`${this.urls.apiUrl}/notifications`);
    }

    markRead(notifications: Notification[]): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/notifications/read`, { notifications });
    }

    clear(notifications: Notification[]): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/notifications/clear`, { notifications });
    }
}
