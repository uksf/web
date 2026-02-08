import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RolesService } from './roles.service';
import { of } from 'rxjs';
import { RolesDataset } from '@app/shared/models/role';

describe('RolesService', () => {
    let service: RolesService;
    let mockHttpClient: any;
    let mockUrls: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of({})),
            post: vi.fn().mockReturnValue(of({})),
            put: vi.fn().mockReturnValue(of({})),
            patch: vi.fn().mockReturnValue(of({})),
            delete: vi.fn().mockReturnValue(of({}))
        };
        mockUrls = { apiUrl: 'http://localhost:5500' };
        service = new RolesService(mockHttpClient, mockUrls);
    });

    it('getRoles calls GET /roles', () => {
        const mockResponse: RolesDataset = { roles: [] };
        mockHttpClient.get.mockReturnValue(of(mockResponse));

        service.getRoles().subscribe({
            next: (result) => expect(result).toEqual(mockResponse)
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/roles');
    });

    it('checkRoleName calls POST /roles/:name with body', () => {
        const existingRole = { name: 'test' } as any;
        mockHttpClient.post.mockReturnValue(of(existingRole));
        const role = { name: 'test' };

        service.checkRoleName('test', role).subscribe({
            next: (result) => expect(result).toEqual(existingRole)
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/roles/test', role);
    });

    it('checkRoleName uses empty body by default', () => {
        service.checkRoleName('test').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/roles/test', {});
    });

    it('addRole calls PUT /roles with JSON headers', () => {
        const formJson = '{"name":"NewRole"}';
        const mockResponse: RolesDataset = { roles: [{ name: 'NewRole' } as any] };
        mockHttpClient.put.mockReturnValue(of(mockResponse));

        service.addRole(formJson).subscribe({
            next: (result) => expect(result.roles).toHaveLength(1)
        });

        expect(mockHttpClient.put).toHaveBeenCalledWith(
            'http://localhost:5500/roles',
            formJson,
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('editRole calls PATCH /roles with JSON headers', () => {
        const role = { name: 'ExistingRole' } as any;
        mockHttpClient.patch.mockReturnValue(of({ roles: [role] }));

        service.editRole(role).subscribe();

        expect(mockHttpClient.patch).toHaveBeenCalledWith(
            'http://localhost:5500/roles',
            role,
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('deleteRole calls DELETE /roles/:id', () => {
        mockHttpClient.delete.mockReturnValue(of({ roles: [] }));

        service.deleteRole('role-123').subscribe({
            next: (result) => expect(result.roles).toEqual([])
        });

        expect(mockHttpClient.delete).toHaveBeenCalledWith('http://localhost:5500/roles/role-123');
    });
});
