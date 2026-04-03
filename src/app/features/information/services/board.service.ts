import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { Board, BoardCard, BoardListItem, CreateBoardRequest, CreateCardRequest, MoveCardRequest, UpdateBoardRequest, UpdateCardRequest } from '../models/board';

@Injectable({ providedIn: 'root' })
export class BoardService {
    private http = inject(HttpClient);
    private urls = inject(UrlService);

    getBoards(): Observable<BoardListItem[]> {
        return this.http.get<BoardListItem[]>(`${this.urls.apiUrl}/boards`);
    }

    getBoard(boardId: string): Observable<Board> {
        return this.http.get<Board>(`${this.urls.apiUrl}/boards/${boardId}`);
    }

    createBoard(request: CreateBoardRequest): Observable<BoardListItem> {
        return this.http.post<BoardListItem>(`${this.urls.apiUrl}/boards`, request);
    }

    updateBoard(boardId: string, request: UpdateBoardRequest): Observable<unknown> {
        return this.http.put(`${this.urls.apiUrl}/boards/${boardId}`, request);
    }

    deleteBoard(boardId: string): Observable<unknown> {
        return this.http.delete(`${this.urls.apiUrl}/boards/${boardId}`);
    }

    createCard(boardId: string, request: CreateCardRequest): Observable<BoardCard> {
        return this.http.post<BoardCard>(`${this.urls.apiUrl}/boards/${boardId}/cards`, request);
    }

    updateCard(boardId: string, cardId: string, request: UpdateCardRequest): Observable<BoardCard> {
        return this.http.put<BoardCard>(`${this.urls.apiUrl}/boards/${boardId}/cards/${cardId}`, request);
    }

    deleteCard(boardId: string, cardId: string): Observable<unknown> {
        return this.http.delete(`${this.urls.apiUrl}/boards/${boardId}/cards/${cardId}`);
    }

    moveCard(boardId: string, cardId: string, request: MoveCardRequest): Observable<BoardCard> {
        return this.http.put<BoardCard>(`${this.urls.apiUrl}/boards/${boardId}/cards/${cardId}/move`, request);
    }

    getDoneCards(boardId: string, skip: number, take: number = 20): Observable<BoardCard[]> {
        return this.http.get<BoardCard[]>(`${this.urls.apiUrl}/boards/${boardId}/done?skip=${skip}&take=${take}`);
    }

    ensureCommentThread(boardId: string, cardId: string): Observable<string> {
        return this.http.post(`${this.urls.apiUrl}/boards/${boardId}/cards/${cardId}/commentthread`, {}, { responseType: 'text' });
    }
}
