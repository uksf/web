import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { UnitsService } from './units.service';

describe('UnitsService', () => {
    let service: UnitsService;
    let httpClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> };
    let urls: { apiUrl: string };

    beforeEach(() => {
        httpClient = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() };
        urls = { apiUrl: 'http://localhost:5500' };
        service = new UnitsService(httpClient as any, urls as any);
    });

    it('should get unit tree', () => {
        const tree = { combatNodes: [], auxiliaryNodes: [], secondaryNodes: [] };
        httpClient.get.mockReturnValue(of(tree));

        service.getUnitTree().subscribe((result) => {
            expect(result).toBe(tree);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/units/tree');
    });

    it('should get unit by id', () => {
        const unit = { id: '1', name: 'Test Unit' };
        httpClient.get.mockReturnValue(of(unit));

        service.getUnit('1').subscribe((result) => {
            expect(result).toBe(unit);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/units/1');
    });

    it('should get units without filter', () => {
        httpClient.get.mockReturnValue(of([]));

        service.getUnits().subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/units');
    });

    it('should get units with filter', () => {
        httpClient.get.mockReturnValue(of([]));

        service.getUnits('combat').subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/units?filter=combat');
    });

    it('should get units with filter and accountId', () => {
        httpClient.get.mockReturnValue(of([]));

        service.getUnits('auxiliary', 'acc1').subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/units?filter=auxiliary&accountId=acc1');
    });

    it('should get units with accountId only', () => {
        httpClient.get.mockReturnValue(of([]));

        service.getUnits(undefined, 'acc1').subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/units?accountId=acc1');
    });

    it('should check unit exists', () => {
        httpClient.get.mockReturnValue(of(true));

        service.checkUnitExists('TestUnit').subscribe((result) => {
            expect(result).toBe(true);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/units/exists/TestUnit');
    });

    it('should check unit exists with edit id', () => {
        httpClient.get.mockReturnValue(of(false));

        service.checkUnitExists('TestUnit', 'unit1').subscribe((result) => {
            expect(result).toBe(false);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/units/exists/TestUnit?id=unit1');
    });

    it('should create unit', () => {
        httpClient.post.mockReturnValue(of(null));
        const formJson = '{"name":"NewUnit"}';

        service.createUnit(formJson).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/units', formJson, {
            headers: expect.objectContaining({ lazyInit: expect.anything() })
        });
    });

    it('should update unit', () => {
        httpClient.put.mockReturnValue(of(null));
        const unit = { id: '1', name: 'Updated' } as any;

        service.updateUnit('1', unit).subscribe();

        expect(httpClient.put).toHaveBeenCalledWith('http://localhost:5500/units/1', unit, {
            headers: expect.objectContaining({ lazyInit: expect.anything() })
        });
    });

    it('should delete unit', () => {
        httpClient.delete.mockReturnValue(of(null));

        service.deleteUnit('1').subscribe();

        expect(httpClient.delete).toHaveBeenCalledWith('http://localhost:5500/units/1');
    });

    it('should update parent', () => {
        httpClient.patch.mockReturnValue(of(null));
        const body = { index: 2, parentId: 'parent1' };

        service.updateParent('unit1', body).subscribe();

        expect(httpClient.patch).toHaveBeenCalledWith('http://localhost:5500/units/unit1/parent', body);
    });

    it('should update order', () => {
        httpClient.patch.mockReturnValue(of(null));
        const body = { index: 3 };

        service.updateOrder('unit1', body).subscribe();

        expect(httpClient.patch).toHaveBeenCalledWith('http://localhost:5500/units/unit1/order', body);
    });
});
