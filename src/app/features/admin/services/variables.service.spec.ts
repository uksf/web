import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { VariablesService } from './variables.service';
import type { VariableItem } from '@app/features/admin/models/variable-item';

describe('VariablesService', () => {
    let service: VariablesService;
    let httpClient: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
    let urls: { apiUrl: string };

    beforeEach(() => {
        httpClient = { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
        urls = { apiUrl: 'http://localhost:5500' };
        service = new VariablesService(httpClient as any, urls as any);
    });

    it('should get variables', () => {
        const variables: VariableItem[] = [{ key: 'TEST_KEY', item: { value: '123' } }];
        httpClient.get.mockReturnValue(of(variables));

        service.getVariables().subscribe((result) => {
            expect(result).toBe(variables);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/variables');
    });

    it('should add a variable', () => {
        httpClient.put.mockReturnValue(of(null));
        const formJson = '{"key":"NEW_KEY","item":"value"}';

        service.addVariable(formJson).subscribe();

        expect(httpClient.put).toHaveBeenCalledWith('http://localhost:5500/variables', formJson, {
            headers: expect.objectContaining({ lazyInit: expect.anything() })
        });
    });

    it('should check variable key existence', () => {
        httpClient.post.mockReturnValue(of(true));

        service.checkVariableKey('TEST_KEY').subscribe((result) => {
            expect(result).toBe(true);
        });

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/variables/TEST_KEY', {});
    });

    it('should edit a variable', () => {
        httpClient.patch.mockReturnValue(of(null));
        const variable: VariableItem = { key: 'TEST_KEY', item: { value: 'updated' } };

        service.editVariable(variable).subscribe();

        expect(httpClient.patch).toHaveBeenCalledWith('http://localhost:5500/variables', variable, {
            headers: expect.objectContaining({ lazyInit: expect.anything() })
        });
    });

    it('should delete a variable', () => {
        httpClient.delete.mockReturnValue(of(null));

        service.deleteVariable('TEST_KEY').subscribe();

        expect(httpClient.delete).toHaveBeenCalledWith('http://localhost:5500/variables/TEST_KEY');
    });
});
