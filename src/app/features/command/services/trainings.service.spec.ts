import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { TrainingsService } from './trainings.service';

describe('TrainingsService', () => {
    let service: TrainingsService;
    let httpClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
    let urls: { apiUrl: string };

    beforeEach(() => {
        httpClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() };
        urls = { apiUrl: 'http://localhost:5500' };
        service = new TrainingsService(httpClient as any, urls as any);
    });

    it('should get trainings', () => {
        const trainings = [{ id: '1', name: 'Test' }];
        httpClient.get.mockReturnValue(of(trainings));

        service.getTrainings().subscribe((result) => {
            expect(result).toBe(trainings);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/trainings');
    });

    it('should check unique', () => {
        httpClient.get.mockReturnValue(of(true));

        service.checkUnique('TestTraining').subscribe((result) => {
            expect(result).toBe(true);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/trainings/check-unique?check=TestTraining');
    });

    it('should add training', () => {
        httpClient.post.mockReturnValue(of(null));
        const formJson = '{"name":"NewTraining"}';

        service.addTraining(formJson).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/trainings', formJson, {
            headers: expect.objectContaining({ lazyInit: expect.anything() })
        });
    });

    it('should edit training', () => {
        const training = { id: '1', name: 'Updated' } as any;
        const result = [training];
        httpClient.patch.mockReturnValue(of(result));

        service.editTraining(training).subscribe((r) => {
            expect(r).toBe(result);
        });

        expect(httpClient.patch).toHaveBeenCalledWith('http://localhost:5500/trainings', training, {
            headers: expect.objectContaining({ lazyInit: expect.anything() })
        });
    });

    it('should delete training', () => {
        const result = [];
        httpClient.delete.mockReturnValue(of(result));

        service.deleteTraining('1').subscribe((r) => {
            expect(r).toBe(result);
        });

        expect(httpClient.delete).toHaveBeenCalledWith('http://localhost:5500/trainings/1');
    });

    it('should update account trainings', () => {
        httpClient.put.mockReturnValue(of(null));
        const trainingIds = ['t1', 't2'];

        service.updateAccountTrainings('acc1', trainingIds).subscribe();

        expect(httpClient.put).toHaveBeenCalledWith('http://localhost:5500/accounts/acc1/training', trainingIds, {
            headers: expect.objectContaining({ lazyInit: expect.anything() })
        });
    });
});
