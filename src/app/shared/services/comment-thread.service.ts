import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';

export interface Comment {
    id: string;
    author: string;
    content: string;
    displayName: string;
    timestamp: Date;
}

export interface CommentThreadResponse {
    comments: Comment[];
}

@Injectable({ providedIn: 'root' })
export class CommentThreadService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getComments(threadId: string): Observable<CommentThreadResponse> {
        return this.httpClient.get<CommentThreadResponse>(`${this.urls.apiUrl}/commentthread/${threadId}`);
    }

    canPost(threadId: string): Observable<boolean> {
        return this.httpClient.get<boolean>(`${this.urls.apiUrl}/commentthread/canpost/${threadId}`);
    }

    postComment(threadId: string, content: string): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/commentthread/${threadId}`, { content });
    }

    deleteComment(threadId: string, commentId: string): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commentthread/${threadId}/${commentId}`, {});
    }
}
