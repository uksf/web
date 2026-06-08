import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription } from '@angular/material/expansion';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { first } from 'rxjs/operators';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '@app/shared/components/content-areas/main-content-area/main-content-area.component';
import { NpcVoicesService } from '../../services/npc-voices.service';
import { NpcVoice } from '../../models/npc-voice';

interface VoiceGroup {
    base: NpcVoice;
    variants: NpcVoice[];
}

@Component({
    selector: 'app-operations-npcs',
    templateUrl: './operations-npcs.component.html',
    styleUrls: ['./operations-npcs.component.scss'],
    imports: [
        FormsModule,
        MatButton,
        MatIconButton,
        MatIcon,
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        MatExpansionPanelDescription,
        MatCard,
        MatProgressSpinner,
        DefaultContentAreasComponent,
        MainContentAreaComponent
    ]
})
export class OperationsNpcsComponent implements OnInit {
    private service = inject(NpcVoicesService);
    private dialog = inject(MatDialog);
    private clipboard = inject(Clipboard);

    @ViewChild('uploader') uploader!: ElementRef<HTMLInputElement>;

    voices: NpcVoice[] | null = null;
    groups: VoiceGroup[] = [];
    displayName = '';
    moodOfTarget: string | null = null; // when set, the next upload is a mood variant
    moodLabel = '';
    uploading = false;
    error: string | null = null;
    private currentAudio: HTMLAudioElement | null = null;

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        this.service.getVoices().pipe(first()).subscribe((voices) => {
            this.voices = voices;
            const bases = voices.filter((v) => !v.moodOf);
            this.groups = bases.map((base) => ({
                base,
                variants: voices.filter((v) => v.moodOf === base.voiceId)
            }));
        });
    }

    triggerUpload(moodOf: string | null): void {
        this.moodOfTarget = moodOf;
        this.uploader.nativeElement.click();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.upload(file);
        }
        input.value = '';
    }

    private upload(file: File): void {
        this.error = null;
        const formData = new FormData();
        formData.append('sample', file, file.name);
        if (this.moodOfTarget) {
            formData.append('moodOf', this.moodOfTarget);
            formData.append('moodLabel', this.moodLabel);
        } else {
            formData.append('displayName', this.displayName);
        }
        this.uploading = true;
        this.service.upload(formData).pipe(first()).subscribe({
            next: () => {
                this.uploading = false;
                this.displayName = '';
                this.moodLabel = '';
                this.moodOfTarget = null;
                this.load();
            },
            error: (err) => {
                this.uploading = false;
                this.error = err?.error?.error ?? err?.message ?? 'Upload failed';
            }
        });
    }

    play(voice: NpcVoice): void {
        this.currentAudio?.pause();
        this.currentAudio = new Audio(this.service.sampleUrl(voice.id));
        this.currentAudio.play();
    }

    copySlug(voiceId: string): void {
        this.clipboard.copy(voiceId);
    }

    delete(voice: NpcVoice): void {
        this.dialog
            .open(ConfirmationModalComponent, { data: { message: `Delete voice '${voice.voiceId}'?` } })
            .afterClosed()
            .pipe(first())
            .subscribe((confirmed) => {
                if (confirmed) {
                    this.service.delete(voice.id).pipe(first()).subscribe(() => this.load());
                }
            });
    }
}
