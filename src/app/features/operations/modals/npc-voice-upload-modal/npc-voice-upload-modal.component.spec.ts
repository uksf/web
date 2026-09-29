import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NpcVoicesService } from '../../services/npc-voices.service';
import { NpcVoiceUploadModalComponent, voiceSlug } from './npc-voice-upload-modal.component';

describe('voiceSlug', () => {
    it('matches the API slug rule', () => {
        expect(voiceSlug('  Old Smuggler!! 2 ')).toBe('old_smuggler_2');
        expect(voiceSlug('***')).toBe('');
    });
});

describe('NpcVoiceUploadModalComponent', () => {
    let component: NpcVoiceUploadModalComponent;
    let service: { upload: ReturnType<typeof vi.fn> };
    let dialogRef: { close: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        service = { upload: vi.fn() };
        dialogRef = { close: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                NpcVoiceUploadModalComponent,
                { provide: NpcVoicesService, useValue: service },
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { takenIds: ['merl'] } }
            ]
        });
        component = TestBed.inject(NpcVoiceUploadModalComponent);
        component.file = new File(['x'], 'voice.wav');
        component.seconds = 8;
    });

    it('blocks a voice ID that is already in use', () => {
        component.name = 'Merl';

        expect(component.slugTaken).toBe(true);
        expect(component.canSubmit).toBe(false);
    });

    it('blocks samples outside 3 to 15 seconds', () => {
        component.name = 'Pavel';
        component.seconds = 2;

        expect(component.lengthProblem).toContain('Too short');
        expect(component.canSubmit).toBe(false);
    });

    it('blocks a file whose length could not be read', () => {
        component.name = 'Pavel';
        component.seconds = null;

        expect(component.canSubmit).toBe(false);

        component.seconds = 8;
        component.fileError = 'This file is not a playable WAV.';
        expect(component.canSubmit).toBe(false);
    });

    it('uploads and returns the voice with the generate choice', () => {
        const created = { voiceId: 'pavel' };
        service.upload.mockReturnValue(of(created));
        component.name = 'Pavel';
        component.generateMoods = false;

        component.submit();

        const form = service.upload.mock.calls[0][0] as FormData;
        expect(form.get('displayName')).toBe('Pavel');
        expect(dialogRef.close).toHaveBeenCalledWith({ voice: created, generateMoods: false });
    });

    it('keeps the dialog open and shows the API error', () => {
        service.upload.mockReturnValue(throwError(() => ({ error: { error: 'Invalid WAV: not RIFF' } })));
        component.name = 'Pavel';

        component.submit();

        expect(component.error).toBe('Invalid WAV: not RIFF');
        expect(component.pending).toBe(false);
        expect(dialogRef.close).not.toHaveBeenCalled();
    });
});
