import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { NgxPermissionsService } from 'ngx-permissions';
import { of, Subject, throwError } from 'rxjs';
import { AccountService } from '@app/core/services/account.service';
import { OperationsNpcsComponent } from './operations-npcs.component';
import { NpcVoicesService } from '../../services/npc-voices.service';
import { NpcMoodStatus, NpcVoice, NpcVoiceJob } from '../../models/npc-voice';

const voice = (voiceId: string, moodOf: string | null = null, ownerId = 'me'): NpcVoice => ({
    id: `id-${voiceId}`,
    voiceId,
    displayName: moodOf ? `Smuggler (${voiceId})` : 'Smuggler',
    moodOf,
    ownerId,
    durationMs: 5000,
    createdAt: ''
});

describe('OperationsNpcsComponent', () => {
    let component: OperationsNpcsComponent;
    let service: Record<string, ReturnType<typeof vi.fn>>;
    let dialog: { open: ReturnType<typeof vi.fn> };
    let clipboard: { copy: ReturnType<typeof vi.fn> };
    let admin: boolean;
    let audio: { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        admin = false;
        service = {
            getVoices: vi.fn().mockReturnValue(of([voice('smuggler'), voice('smuggler_angry', 'smuggler')])),
            getJob: vi.fn().mockReturnValue(of(null)),
            upload: vi.fn().mockReturnValue(of({})),
            delete: vi.fn().mockReturnValue(of(undefined)),
            getSample: vi.fn().mockReturnValue(of(new Blob(['x']))),
            generateMoods: vi.fn()
        };
        dialog = { open: vi.fn().mockReturnValue({ afterClosed: () => of(true) }) };
        clipboard = { copy: vi.fn() };
        audio = { play: vi.fn().mockResolvedValue(undefined), pause: vi.fn() };
        (globalThis as unknown as { Audio: unknown }).Audio = vi.fn(function () {
            return audio;
        });
        URL.createObjectURL = vi.fn().mockReturnValue('blob:x');
        URL.revokeObjectURL = vi.fn();

        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                OperationsNpcsComponent,
                { provide: NpcVoicesService, useValue: service },
                { provide: MatDialog, useValue: dialog },
                { provide: Clipboard, useValue: clipboard },
                { provide: AccountService, useValue: { account: { id: 'me' }, accountChange$: new Subject() } },
                { provide: NgxPermissionsService, useValue: { getPermission: (p: string) => (p === 'ADMIN' && admin ? {} : undefined) } }
            ]
        });
        component = TestBed.inject(OperationsNpcsComponent);
    });

    afterEach(() => {
        component.ngOnDestroy();
        delete (globalThis as unknown as { Audio?: unknown }).Audio;
    });

    it('groups a voice with its five moods', () => {
        component.ngOnInit();

        expect(component.groups).toHaveLength(1);
        expect(component.groups[0].moods.map((m) => `${m.mood}:${m.state}`)).toEqual(['neutral:missing', 'angry:ready', 'afraid:missing', 'sad:missing', 'happy:missing']);
    });

    it('shows a queued mood as generating and a failed one with its error', () => {
        const job: NpcVoiceJob = {
            id: 'j',
            baseVoiceId: 'smuggler',
            ownerId: 'me',
            createdAt: '',
            moods: [
                { mood: 'sad', status: NpcMoodStatus.Pending, error: null },
                { mood: 'happy', status: NpcMoodStatus.Failed, error: 'generation failed' }
            ]
        };
        service['getJob'].mockReturnValue(of(job));

        component.ngOnInit();

        const moods = component.groups[0].moods;
        expect(moods.find((m) => m.mood === 'sad')?.state).toBe('generating');
        expect(moods.find((m) => m.mood === 'happy')).toMatchObject({ state: 'failed', error: 'generation failed' });
    });

    it('reports a failed load instead of spinning forever', () => {
        service['getVoices'].mockReturnValue(throwError(() => new Error('down')));

        component.ngOnInit();

        expect(component.loadFailed).toBe(true);
        expect(component.voices).toEqual([]);
    });

    it('filters by name or voice ID', () => {
        service['getVoices'].mockReturnValue(of([voice('smuggler'), { ...voice('pavel'), displayName: 'Pavel' }]));
        component.ngOnInit();

        component.filter = 'pav';
        component.applyFilter();

        expect(component.filtered.map((g) => g.voiceId)).toEqual(['pavel']);
    });

    it('plays a sample through the authenticated request and stops on a second press', () => {
        const target = voice('smuggler');

        component.play(target);
        expect(service['getSample']).toHaveBeenCalledWith('id-smuggler');
        expect(audio.play).toHaveBeenCalled();
        expect(component.player.playingId).toBe('id-smuggler');

        component.play(target);
        expect(audio.pause).toHaveBeenCalled();
        expect(component.player.playingId).toBeNull();
    });

    it('generates only the chosen mood', () => {
        service['generateMoods'].mockReturnValue(of({ id: 'j', baseVoiceId: 'smuggler', ownerId: 'me', createdAt: '', moods: [{ mood: 'sad', status: NpcMoodStatus.Pending, error: null }] }));
        component.ngOnInit();

        component.generate('smuggler', ['sad']);

        expect(service['generateMoods']).toHaveBeenCalledWith('smuggler', ['sad']);
        expect(component.groups[0].moods.find((m) => m.mood === 'sad')?.state).toBe('generating');
    });

    it('copies the voice ID without toggling the panel', () => {
        const event = { stopPropagation: vi.fn() } as unknown as Event;

        component.copy('smuggler', event);

        expect(clipboard.copy).toHaveBeenCalledWith('smuggler');
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(component.copiedId).toBe('smuggler');
    });

    it('deletes after confirmation and reloads', () => {
        component.ngOnInit();

        component.delete(voice('smuggler'), 'Delete?');

        expect(service['delete']).toHaveBeenCalledWith('id-smuggler');
        expect(service['getVoices']).toHaveBeenCalledTimes(2);
    });

    it('lets owners and admins manage a voice, and nobody else', () => {
        expect(component.canManage(voice('smuggler', null, 'me'))).toBe(true);
        expect(component.canManage(voice('smuggler', null, 'someone'))).toBe(false);

        admin = true;
        expect(component.canManage(voice('smuggler', null, 'someone'))).toBe(true);
    });

    it('names the moods that a delete removes', () => {
        component.ngOnInit();

        expect(component.deleteVoiceMessage(component.groups[0])).toContain("'Smuggler' and its 1 mood?");
    });
});
