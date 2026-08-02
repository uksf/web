import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AdminBackupsComponent } from './admin-backups.component';
import { BackupsService } from '../../services/backups.service';
import { BackupEntry, BackupEntryType } from '@app/features/admin/models/backup';

describe('AdminBackupsComponent', () => {
    let component: AdminBackupsComponent;
    let mockBackupsService: any;
    let mockDialog: any;

    const folderEntry: BackupEntry = {
        id: 'entry-1',
        path: 'C:\\Server\\Nginx',
        entryType: BackupEntryType.Folder,
        recursive: true,
        includePatterns: [],
        excludes: ['C:\\Server\\Nginx\\logs'],
        enabled: true
    };

    const build = (confirmResult = true) => {
        mockDialog = { open: vi.fn().mockReturnValue({ afterClosed: () => of(confirmResult) }) };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [AdminBackupsComponent, { provide: BackupsService, useValue: mockBackupsService }, { provide: MatDialog, useValue: mockDialog }]
        });

        component = TestBed.inject(AdminBackupsComponent);
        component.ngOnInit();
    };

    beforeEach(() => {
        mockBackupsService = {
            getEntries: vi.fn().mockReturnValue(of([folderEntry])),
            getRuns: vi.fn().mockReturnValue(of([])),
            addEntry: vi.fn().mockReturnValue(of(folderEntry)),
            updateEntry: vi.fn().mockReturnValue(of(folderEntry)),
            deleteEntry: vi.fn().mockReturnValue(of(null)),
            runNow: vi.fn().mockReturnValue(of({}))
        };

        build();
    });

    it('loads the selection and runs on init', () => {
        expect(component.entries).toEqual([folderEntry]);
        expect(mockBackupsService.getRuns).toHaveBeenCalled();
        expect(component.loading).toBe(false);
    });

    it('exposes selected and excluded paths for the tree', () => {
        expect(component.selectedPaths).toEqual(['C:\\Server\\Nginx']);
        expect(component.excludedPaths).toEqual(['C:\\Server\\Nginx\\logs']);
    });

    it('includes a folder recursively by default', () => {
        component.include({ name: 'conf', path: 'D:\\Website', isDirectory: true, hasChildren: true });

        expect(mockBackupsService.addEntry).toHaveBeenCalledWith({
            path: 'D:\\Website',
            entryType: BackupEntryType.Folder,
            recursive: true,
            includePatterns: [],
            excludes: [],
            enabled: true
        });
    });

    it('includes a single file as a file entry', () => {
        component.include({ name: 'appsettings.json', path: 'C:\\Server\\UKSF.Api\\appsettings.json', isDirectory: false, hasChildren: false });

        expect(mockBackupsService.addEntry).toHaveBeenCalledWith(expect.objectContaining({ entryType: BackupEntryType.File, recursive: true }));
    });

    it('adds an exclude to the selection that contains it', () => {
        component.exclude({ name: 'temp', path: 'C:\\Server\\Nginx\\temp', isDirectory: true, hasChildren: false });

        expect(mockBackupsService.updateEntry).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'entry-1', excludes: ['C:\\Server\\Nginx\\logs', 'C:\\Server\\Nginx\\temp'] })
        );
    });

    it('ignores an exclude with no selection above it', () => {
        component.exclude({ name: 'other', path: 'D:\\Elsewhere\\thing', isDirectory: true, hasChildren: false });

        expect(mockBackupsService.updateEntry).not.toHaveBeenCalled();
    });

    it('toggles enabled and recursive without losing the rest of the entry', () => {
        component.toggleEnabled(folderEntry, false);
        expect(mockBackupsService.updateEntry).toHaveBeenCalledWith(expect.objectContaining({ enabled: false, excludes: folderEntry.excludes }));

        component.toggleRecursive(folderEntry, false);
        expect(mockBackupsService.updateEntry).toHaveBeenCalledWith(expect.objectContaining({ recursive: false }));
    });

    it('deletes only after confirmation', () => {
        component.deleteEntry(folderEntry);
        expect(mockBackupsService.deleteEntry).toHaveBeenCalledWith('entry-1');

        mockBackupsService.deleteEntry.mockClear();
        build(false);
        component.deleteEntry(folderEntry);
        expect(mockBackupsService.deleteEntry).not.toHaveBeenCalled();
    });

    it('runs a backup after confirmation and refreshes the history', () => {
        mockBackupsService.getRuns.mockClear();

        component.runNow();

        expect(mockBackupsService.runNow).toHaveBeenCalled();
        expect(mockBackupsService.getRuns).toHaveBeenCalled();
        expect(component.running).toBe(false);
    });

    it('surfaces a rejected change instead of failing silently', () => {
        mockBackupsService.addEntry.mockReturnValue(throwError(() => ({ error: { detail: 'Path overlaps an existing selection' } })));

        component.include({ name: 'Nginx', path: 'C:\\Server\\Nginx\\conf', isDirectory: true, hasChildren: true });

        expect(component.error).toBe('Path overlaps an existing selection');
        expect(component.updating).toBe(false);
    });

    it('deselecting a folder drops it and everything selected below it', () => {
        const child: BackupEntry = { ...folderEntry, id: 'entry-2', path: 'C:\\Server\\Nginx\\conf', excludes: [] };
        const other: BackupEntry = { ...folderEntry, id: 'entry-3', path: 'D:\\Website', excludes: [] };
        mockBackupsService.getEntries.mockReturnValue(of([folderEntry, child, other]));
        build();

        component.deselect({ name: 'Nginx', path: 'C:\\Server\\Nginx', isDirectory: true, hasChildren: true });

        expect(mockBackupsService.deleteEntry).toHaveBeenCalledWith('entry-1');
        expect(mockBackupsService.deleteEntry).toHaveBeenCalledWith('entry-2');
        expect(mockBackupsService.deleteEntry).not.toHaveBeenCalledWith('entry-3');
    });

    it('deselecting a parent of a selection drops the selection below it', () => {
        const child: BackupEntry = { ...folderEntry, id: 'entry-2', path: 'C:\\Server\\Nginx\\conf', excludes: [] };
        mockBackupsService.getEntries.mockReturnValue(of([child]));
        build();

        component.deselect({ name: 'Server', path: 'C:\\Server', isDirectory: true, hasChildren: true });

        expect(mockBackupsService.deleteEntry).toHaveBeenCalledWith('entry-2');
    });

    it('deselecting where nothing is selected does nothing', () => {
        component.deselect({ name: 'Elsewhere', path: 'D:\\Elsewhere', isDirectory: true, hasChildren: true });

        expect(mockDialog.open).not.toHaveBeenCalled();
        expect(mockBackupsService.deleteEntry).not.toHaveBeenCalled();
    });

    it('deselecting is cancelled by declining the confirmation', () => {
        build(false);

        component.deselect({ name: 'Nginx', path: 'C:\\Server\\Nginx', isDirectory: true, hasChildren: true });

        expect(mockBackupsService.deleteEntry).not.toHaveBeenCalled();
    });

    it('lists includes and excludes as one set of rules, excludes prefixed', () => {
        const entry = { ...folderEntry, includePatterns: ['*.Arma3Profile'] };

        expect(component.rules(entry)).toEqual([
            { text: '*.Arma3Profile', exclude: false },
            { text: '!C:\\Server\\Nginx\\logs', exclude: true }
        ]);
    });

    it('a rule without ! is an include pattern', () => {
        const input = { value: '*.Arma3Profile' } as HTMLInputElement;

        component.addRule(folderEntry, ' *.Arma3Profile ', input);

        expect(mockBackupsService.updateEntry).toHaveBeenCalledWith(expect.objectContaining({ includePatterns: ['*.Arma3Profile'] }));
        expect(input.value).toBe('');
    });

    it('a rule starting with ! is an exclude, without the prefix', () => {
        const input = { value: '!DevRun_*' } as HTMLInputElement;

        component.addRule(folderEntry, '!DevRun_* ', input);

        expect(mockBackupsService.updateEntry).toHaveBeenCalledWith(
            expect.objectContaining({ excludes: ['C:\\Server\\Nginx\\logs', 'DevRun_*'] })
        );
    });

    it('ignores an empty rule, and a bare !', () => {
        const input = { value: '' } as HTMLInputElement;

        component.addRule(folderEntry, '   ', input);
        component.addRule(folderEntry, '!', input);

        expect(mockBackupsService.updateEntry).not.toHaveBeenCalled();
    });

    it('removes a rule from whichever list it came from', () => {
        const entry = { ...folderEntry, includePatterns: ['*.Arma3Profile', '*.vars.*'] };

        component.removeRule(entry, { text: '*.vars.*', exclude: false });
        expect(mockBackupsService.updateEntry).toHaveBeenCalledWith(expect.objectContaining({ includePatterns: ['*.Arma3Profile'] }));

        component.removeRule(entry, { text: '!C:\\Server\\Nginx\\logs', exclude: true });
        expect(mockBackupsService.updateEntry).toHaveBeenCalledWith(expect.objectContaining({ excludes: [] }));
    });

    it('surfaces a failed run and still refreshes the history', () => {
        mockBackupsService.runNow.mockReturnValue(throwError(() => ({ error: { detail: 'mongodump failed' } })));
        mockBackupsService.getRuns.mockClear();

        component.runNow();

        expect(component.error).toBe('mongodump failed');
        expect(component.running).toBe(false);
        expect(mockBackupsService.getRuns).toHaveBeenCalled();
    });
});
