import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoardService } from './board.service';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';

describe('BoardService', () => {
    let service: BoardService;
    let mockHttp: any;

    beforeEach(() => {
        mockHttp = {
            get: vi.fn().mockReturnValue(of([])),
            post: vi.fn().mockReturnValue(of({})),
            put: vi.fn().mockReturnValue(of({})),
            delete: vi.fn().mockReturnValue(of({}))
        };

        TestBed.configureTestingModule({
            providers: [
                BoardService,
                { provide: HttpClient, useValue: mockHttp },
                { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500/api' } }
            ]
        });

        service = TestBed.inject(BoardService);
    });

    it('should get boards', () => {
        service.getBoards().subscribe();
        expect(mockHttp.get).toHaveBeenCalledWith('http://localhost:5500/api/boards');
    });

    it('should get a board by id', () => {
        service.getBoard('123').subscribe();
        expect(mockHttp.get).toHaveBeenCalledWith('http://localhost:5500/api/boards/123');
    });

    it('should create a board', () => {
        const request = { name: 'Test', permissions: { units: [], members: [], expandToSubUnits: true } };
        service.createBoard(request).subscribe();
        expect(mockHttp.post).toHaveBeenCalledWith('http://localhost:5500/api/boards', request);
    });

    it('should create a card', () => {
        const request = { title: 'New Card' };
        service.createCard('board1', request).subscribe();
        expect(mockHttp.post).toHaveBeenCalledWith('http://localhost:5500/api/boards/board1/cards', request);
    });

    it('should move a card', () => {
        const request = { targetColumn: 2, targetIndex: 0 };
        service.moveCard('board1', 'card1', request).subscribe();
        expect(mockHttp.put).toHaveBeenCalledWith('http://localhost:5500/api/boards/board1/cards/card1/move', request);
    });

    it('should get done cards with pagination', () => {
        service.getDoneCards('board1', 20, 20).subscribe();
        expect(mockHttp.get).toHaveBeenCalledWith('http://localhost:5500/api/boards/board1/done?skip=20&take=20');
    });

    it('should delete a board', () => {
        service.deleteBoard('board1').subscribe();
        expect(mockHttp.delete).toHaveBeenCalledWith('http://localhost:5500/api/boards/board1');
    });
});
