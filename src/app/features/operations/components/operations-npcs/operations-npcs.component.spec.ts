import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { of } from 'rxjs';
import { OperationsNpcsComponent } from './operations-npcs.component';
import { NpcVoicesService } from '../../services/npc-voices.service';

describe('OperationsNpcsComponent', () => {
    let component: OperationsNpcsComponent;
    let mockService: Record<string, ReturnType<typeof vi.fn>>;
    let mockDialog: { open: ReturnType<typeof vi.fn> };
    let mockClipboard: { copy: ReturnType<typeof vi.fn> };
    let audioSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockService = {
            getVoices: vi.fn().mockReturnValue(of([
                { id: '1', voiceId: 'smuggler', displayName: 'Smuggler', moodOf: null, ownerId: 'u', durationMs: 5000, createdAt: '' },
                { id: '2', voiceId: 'smuggler_angry', displayName: 'Smuggler', moodOf: 'smuggler', ownerId: 'u', durationMs: 4000, createdAt: '' }
            ])),
            upload: vi.fn().mockReturnValue(of({})),
            delete: vi.fn().mockReturnValue(of(undefined)),
            sampleUrl: vi.fn().mockReturnValue('http://x/sample')
        };
        mockDialog = { open: vi.fn().mockReturnValue({ afterClosed: () => of(true) }) };
        mockClipboard = { copy: vi.fn() };
        audioSpy = vi.fn(function () {
            return { play: vi.fn(), pause: vi.fn() };
        });
        (globalThis as unknown as { Audio: unknown }).Audio = audioSpy;

        TestBed.configureTestingModule({
            providers: [
                OperationsNpcsComponent,
                { provide: NpcVoicesService, useValue: mockService },
                { provide: MatDialog, useValue: mockDialog },
                { provide: Clipboard, useValue: mockClipboard }
            ]
        });
        component = TestBed.inject(OperationsNpcsComponent);
    });

    afterEach(() => { delete (globalThis as unknown as { Audio?: unknown }).Audio; });

    it('loads and groups voices with mood variants nested', () => {
        component.ngOnInit();
        expect(component.groups.length).toBe(1);
        expect(component.groups[0].base.voiceId).toBe('smuggler');
        expect(component.groups[0].variants.map((v) => v.voiceId)).toEqual(['smuggler_angry']);
    });

    it('copies a voice slug', () => {
        component.copySlug('smuggler');
        expect(mockClipboard.copy).toHaveBeenCalledWith('smuggler');
    });

    it('plays a sample via Audio', () => {
        component.play({ id: '1' } as never);
        expect(audioSpy).toHaveBeenCalledWith('http://x/sample');
    });

    it('deletes after confirmation and reloads', () => {
        component.ngOnInit();
        component.delete({ id: '1', voiceId: 'smuggler' } as never);
        expect(mockService.delete).toHaveBeenCalledWith('1');
        expect(mockService.getVoices).toHaveBeenCalledTimes(2); // initial + reload
    });
});
