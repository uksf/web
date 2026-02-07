import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { CommentThreadService } from './comment-thread.service';
import type { CommentThreadResponse } from './comment-thread.service';

describe('CommentThreadService', () => {
    let service: CommentThreadService;
    let httpClient: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
    let urls: { apiUrl: string };

    beforeEach(() => {
        httpClient = { get: vi.fn(), put: vi.fn(), post: vi.fn() };
        urls = { apiUrl: 'http://localhost:5500' };
        service = new CommentThreadService(httpClient as any, urls as any);
    });

    it('should get comments for a thread', () => {
        const response: CommentThreadResponse = {
            comments: [{ id: '1', author: 'a1', content: 'Hello', displayName: 'User', timestamp: new Date() }]
        };
        httpClient.get.mockReturnValue(of(response));

        service.getComments('thread1').subscribe((result) => {
            expect(result).toBe(response);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/commentthread/thread1');
    });

    it('should check if user can post', () => {
        httpClient.get.mockReturnValue(of(true));

        service.canPost('thread1').subscribe((result) => {
            expect(result).toBe(true);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/commentthread/canpost/thread1');
    });

    it('should post a comment', () => {
        httpClient.put.mockReturnValue(of(null));

        service.postComment('thread1', 'Hello world').subscribe();

        expect(httpClient.put).toHaveBeenCalledWith('http://localhost:5500/commentthread/thread1', { content: 'Hello world' });
    });

    it('should delete a comment', () => {
        httpClient.post.mockReturnValue(of(null));

        service.deleteComment('thread1', 'comment1').subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/commentthread/thread1/comment1', {});
    });
});
