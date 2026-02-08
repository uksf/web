import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandTrainingComponent } from './command-training.component';
import { of, Subject } from 'rxjs';
import { Training } from '@app/features/command/models/training';

describe('CommandTrainingComponent', () => {
    let component: CommandTrainingComponent;
    let mockTrainingsService: any;
    let mockDialog: any;

    const makeTraining = (overrides: Partial<Training> = {}): Training => ({
        id: 't1',
        name: 'Basic Training',
        shortName: 'BT',
        teamspeakGroup: 'basic-training',
        ...overrides
    });

    beforeEach(() => {
        mockTrainingsService = {
            getTrainings: vi.fn().mockReturnValue(of([])),
            checkUnique: vi.fn().mockReturnValue(of(true)),
            editTraining: vi.fn().mockReturnValue(of([])),
            deleteTraining: vi.fn().mockReturnValue(of([]))
        };
        mockDialog = { open: vi.fn() };

        component = new CommandTrainingComponent(mockTrainingsService, mockDialog);
    });

    describe('ngOnInit', () => {
        it('fetches trainings', () => {
            const trainings = [makeTraining()];
            mockTrainingsService.getTrainings.mockReturnValue(of(trainings));

            component.ngOnInit();

            expect(mockTrainingsService.getTrainings).toHaveBeenCalled();
            expect(component.trainings).toEqual(trainings);
        });
    });

    describe('getTrainings', () => {
        it('assigns trainings from response', () => {
            const trainings = [makeTraining({ id: '1' }), makeTraining({ id: '2' })];
            mockTrainingsService.getTrainings.mockReturnValue(of(trainings));

            component.getTrainings();

            expect(component.trainings).toHaveLength(2);
        });
    });

    describe('editTraining', () => {
        it('finds training by name and sends edit', () => {
            const training = makeTraining({ name: 'Advanced' });
            component.trainings = [training];
            const updatedList = [makeTraining({ name: 'Advanced Updated' })];
            mockTrainingsService.editTraining.mockReturnValue(of(updatedList));

            component.editTraining('Advanced');

            expect(mockTrainingsService.editTraining).toHaveBeenCalledWith(training);
            expect(component.trainings).toEqual(updatedList);
        });

        it('finds training by shortName', () => {
            const training = makeTraining({ shortName: 'AT' });
            component.trainings = [training];
            mockTrainingsService.editTraining.mockReturnValue(of([]));

            component.editTraining('AT');

            expect(mockTrainingsService.editTraining).toHaveBeenCalledWith(training);
        });

        it('finds training by teamspeakGroup', () => {
            const training = makeTraining({ teamspeakGroup: 'ts-group' });
            component.trainings = [training];
            mockTrainingsService.editTraining.mockReturnValue(of([]));

            component.editTraining('ts-group');

            expect(mockTrainingsService.editTraining).toHaveBeenCalledWith(training);
        });

        it('does nothing when training not found', () => {
            component.trainings = [makeTraining()];

            component.editTraining('nonexistent');

            expect(mockTrainingsService.editTraining).not.toHaveBeenCalled();
        });
    });

    describe('deleteTraining', () => {
        it('opens confirmation dialog and deletes on confirm', () => {
            const training = makeTraining({ id: 'del1', name: 'To Delete' });
            component.trainings = [training];
            const event = { stopPropagation: vi.fn() };
            const dialogClose$ = new Subject<boolean>();
            mockDialog.open.mockReturnValue({ afterClosed: () => dialogClose$.asObservable() });
            const updatedList: Training[] = [];
            mockTrainingsService.deleteTraining.mockReturnValue(of(updatedList));

            component.deleteTraining(event, training);

            expect(event.stopPropagation).toHaveBeenCalled();
            expect(mockDialog.open).toHaveBeenCalled();

            dialogClose$.next(true);

            expect(mockTrainingsService.deleteTraining).toHaveBeenCalledWith('del1');
            expect(component.trainings).toEqual([]);
        });

        it('does not delete when dialog cancelled', () => {
            const training = makeTraining();
            const event = { stopPropagation: vi.fn() };
            const dialogClose$ = new Subject<boolean>();
            mockDialog.open.mockReturnValue({ afterClosed: () => dialogClose$.asObservable() });

            component.deleteTraining(event, training);
            dialogClose$.next(false);

            expect(mockTrainingsService.deleteTraining).not.toHaveBeenCalled();
        });
    });

    describe('addTraining', () => {
        it('opens add training modal and refreshes on close', () => {
            const dialogClose$ = new Subject<void>();
            mockDialog.open.mockReturnValue({ afterClosed: () => dialogClose$.asObservable() });
            const trainings = [makeTraining()];
            mockTrainingsService.getTrainings.mockReturnValue(of(trainings));

            component.addTraining();
            dialogClose$.next(undefined);

            expect(mockDialog.open).toHaveBeenCalled();
            expect(mockTrainingsService.getTrainings).toHaveBeenCalled();
        });
    });

    describe('trackByTrainingId', () => {
        it('returns training id', () => {
            const training = makeTraining({ id: 'test-id' });

            expect(component.trackByTrainingId(0, training)).toBe('test-id');
        });
    });
});
