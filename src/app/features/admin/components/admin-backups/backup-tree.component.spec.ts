import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BackupTreeComponent } from './backup-tree.component';
import { BackupsService } from '../../services/backups.service';
import { BackupTreeNode } from '@app/features/admin/models/backup';

describe('BackupTreeComponent', () => {
    let component: BackupTreeComponent;
    let mockBackupsService: any;

    const drive: BackupTreeNode = { name: 'C:\\', path: 'C:\\', isDirectory: true, hasChildren: true };
    const server: BackupTreeNode = { name: 'Server', path: 'C:\\Server', isDirectory: true, hasChildren: true };
    const nginx: BackupTreeNode = { name: 'Nginx', path: 'C:\\Server\\Nginx', isDirectory: true, hasChildren: true };
    const file: BackupTreeNode = { name: 'deets.txt', path: 'C:\\Server\\deets.txt', isDirectory: false, hasChildren: false };

    const build = () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: [BackupTreeComponent, { provide: BackupsService, useValue: mockBackupsService }] });
        component = TestBed.inject(BackupTreeComponent);
        component.ngOnInit();
    };

    beforeEach(() => {
        mockBackupsService = {
            getTree: vi.fn().mockImplementation((path?: string) => {
                if (!path) {
                    return of([drive]);
                }
                if (path === 'C:\\') {
                    return of([server, file]);
                }
                return of([nginx]);
            })
        };

        build();
    });

    it('starts at the drives', () => {
        expect(component.rows.map((row) => row.node.path)).toEqual(['C:\\']);
        expect(component.loading).toBe(false);
    });

    it('inserts children directly beneath the expanded row', () => {
        component.toggle(component.rows[0]);

        expect(component.rows.map((row) => row.node.path)).toEqual(['C:\\', 'C:\\Server', 'C:\\Server\\deets.txt']);
        expect(component.rows[1].level).toBe(1);
    });

    it('collapsing removes the whole subtree, not just the direct children', () => {
        component.toggle(component.rows[0]);
        component.toggle(component.rows[1]);
        expect(component.rows).toHaveLength(4);

        component.toggle(component.rows[0]);

        expect(component.rows.map((row) => row.node.path)).toEqual(['C:\\']);
    });

    it('does not try to expand a file', () => {
        component.toggle(component.rows[0]);
        mockBackupsService.getTree.mockClear();

        component.toggle(component.rows[2]);

        expect(mockBackupsService.getTree).not.toHaveBeenCalled();
    });

    it('marks a selected path and anything inside it', () => {
        component.selectedPaths = ['C:\\Server'];
        component.toggle(component.rows[0]);

        const serverRow = component.rows[1];
        expect(component.isSelected(serverRow)).toBe(true);
        expect(component.isCovered(serverRow)).toBe(false);

        component.toggle(serverRow);
        expect(component.isCovered(component.rows[2])).toBe(true);
    });

    it('matches paths case-insensitively', () => {
        component.selectedPaths = ['c:\\server'];
        component.toggle(component.rows[0]);

        expect(component.isSelected(component.rows[1])).toBe(true);
    });

    it('marks excluded paths', () => {
        component.excludedPaths = ['C:\\Server\\deets.txt'];
        component.toggle(component.rows[0]);

        expect(component.isExcluded(component.rows[2])).toBe(true);
    });

    it('a sibling with a shared prefix is not treated as inside', () => {
        component.selectedPaths = ['C:\\Serve'];
        component.toggle(component.rows[0]);

        expect(component.isCovered(component.rows[1])).toBe(false);
    });

    it('reports when drives cannot be read', () => {
        mockBackupsService.getTree = vi.fn().mockReturnValue(throwError(() => new Error('denied')));

        build();

        expect(component.error).toBe('Could not read drives');
        expect(component.loading).toBe(false);
    });

    it('clears the row spinner when children fail to load', () => {
        component.toggle(component.rows[0]);
        component.rows[0].expanded = false;
        mockBackupsService.getTree = vi.fn().mockReturnValue(throwError(() => new Error('denied')));

        component.toggle(component.rows[0]);

        expect(component.rows[0].loading).toBe(false);
    });
});
