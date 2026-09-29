import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { first } from 'rxjs/operators';
import { AutofocusStopComponent } from '@app/shared/components/elements/autofocus-stop/autofocus-stop.component';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { NpcVoice } from '../../models/npc-voice';
import { NpcVoicesService } from '../../services/npc-voices.service';

export interface NpcVoiceUploadData {
    takenIds: string[];
}

export interface NpcVoiceUploadResult {
    voice: NpcVoice;
    generateMoods: boolean;
}

const MIN_SECONDS = 3;
const MAX_SECONDS = 15;

// Same rule as the API's VoiceSlug, so the preview matches the ID the voice will get.
export function voiceSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

@Component({
    selector: 'app-npc-voice-upload-modal',
    templateUrl: './npc-voice-upload-modal.component.html',
    styleUrls: ['./npc-voice-upload-modal.component.scss'],
    imports: [FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, MatCheckbox, MatIcon, AutofocusStopComponent, ButtonComponent, TextInputComponent]
})
export class NpcVoiceUploadModalComponent {
    private dialogRef = inject(MatDialogRef<NpcVoiceUploadModalComponent, NpcVoiceUploadResult>);
    private service = inject(NpcVoicesService);
    private data = inject<NpcVoiceUploadData>(MAT_DIALOG_DATA, { optional: true });

    name = '';
    file: File | null = null;
    seconds: number | null = null;
    generateMoods = true;
    pending = false;
    error: string | null = null;

    get slug(): string {
        return voiceSlug(this.name);
    }

    get lengthProblem(): string | null {
        if (this.seconds === null) return null;
        if (this.seconds < MIN_SECONDS) return `Too short (${this.seconds.toFixed(1)} s). Use 3 to 15 seconds.`;
        if (this.seconds > MAX_SECONDS) return `Too long (${this.seconds.toFixed(1)} s). Use 3 to 15 seconds.`;
        return null;
    }

    get slugTaken(): boolean {
        return !!this.data?.takenIds.includes(this.slug);
    }

    get canSubmit(): boolean {
        return !!this.slug && !this.slugTaken && !!this.file && !this.lengthProblem && !this.pending;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        this.file = file;
        this.seconds = null;
        this.error = null;
        if (!this.name) this.name = file.name.replace(/\.wav$/i, '');
        this.measure(file);
    }

    submit(): void {
        if (!this.canSubmit || !this.file) return;
        this.pending = true;
        this.error = null;
        const formData = new FormData();
        formData.append('sample', this.file, this.file.name);
        formData.append('displayName', this.name.trim());
        this.service
            .upload(formData)
            .pipe(first())
            .subscribe({
                next: (voice) => this.dialogRef.close({ voice, generateMoods: this.generateMoods }),
                error: (err) => {
                    this.pending = false;
                    this.error = err?.error?.error ?? err?.error ?? 'Upload failed';
                }
            });
    }

    cancel(): void {
        this.dialogRef.close();
    }

    private measure(file: File): void {
        const url = URL.createObjectURL(file);
        const audio = new Audio();
        audio.onloadedmetadata = () => {
            this.seconds = audio.duration;
            URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
            this.error = 'This file is not a playable WAV.';
            URL.revokeObjectURL(url);
        };
        audio.src = url;
    }
}
