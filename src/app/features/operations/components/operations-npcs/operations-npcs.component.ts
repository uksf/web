import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { NpcVoice, NpcVoiceJob } from '../../models/npc-voice';

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
export class OperationsNpcsComponent implements OnInit, OnDestroy {
    private service = inject(NpcVoicesService);
    private dialog = inject(MatDialog);
    private clipboard = inject(Clipboard);

    @ViewChild('uploader') uploader!: ElementRef<HTMLInputElement>;

    voices: NpcVoice[] | null = null;
    groups: VoiceGroup[] = [];
    displayName = '';
    moodOfTarget: string | null = null; // when set, the next upload is a mood variant
    moodLabels = new Map<string, string>(); // per-base-voice mood label, keyed on base voiceId
    jobs: Record<string, NpcVoiceJob> = {};
    uploading = false;
    error: string | null = null;
    private currentAudio: HTMLAudioElement | null = null;

    ngOnInit(): void {
        this.load();
    }

    ngOnDestroy(): void {
        this.currentAudio?.pause();
        this.currentAudio = null;
    }

    getMoodLabel(voiceId: string): string {
        return this.moodLabels.get(voiceId) ?? '';
    }

    setMoodLabel(voiceId: string, value: string): void {
        this.moodLabels.set(voiceId, value);
    }

    private load(): void {
        this.service.getVoices().pipe(first()).subscribe((voices) => {
            this.voices = voices;
            const bases = voices.filter((v) => !v.moodOf);
            this.groups = bases.map((base) => ({
                base,
                variants: voices.filter((v) => v.moodOf === base.voiceId)
            }));
            this.groups.forEach((g) => this.refreshJob(g.base.voiceId));
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
        } else {
            this.moodOfTarget = null; // picker dismissed without a file — discard the variant intent
        }
        input.value = '';
    }

    private upload(file: File): void {
        this.error = null;
        const moodOf = this.moodOfTarget;
        const formData = new FormData();
        formData.append('sample', file, file.name);
        if (moodOf) {
            formData.append('moodOf', moodOf);
            formData.append('moodLabel', this.getMoodLabel(moodOf));
        } else {
            formData.append('displayName', this.displayName);
        }
        this.uploading = true;
        this.service.upload(formData).pipe(first()).subscribe({
            next: () => {
                this.uploading = false;
                this.displayName = '';
                if (moodOf) {
                    this.moodLabels.delete(moodOf);
                }
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

    generateMoods(baseVoiceId: string): void {
        this.service.generateMoods(baseVoiceId).pipe(first()).subscribe({
            next: (job) => {
                this.jobs[baseVoiceId] = job;
                this.pollJob(baseVoiceId);
            },
            error: (err) => { this.error = err?.error?.error ?? 'Mood generation failed to start'; }
        });
    }

    private refreshJob(baseVoiceId: string): void {
        this.service.getJob(baseVoiceId).pipe(first()).subscribe({
            next: (job) => {
                this.jobs[baseVoiceId] = job;
                if (this.jobActive(job)) this.pollJob(baseVoiceId);
            },
            error: () => { /* 404 = no job for this voice, leave undefined */ }
        });
    }

    private jobActive(job: NpcVoiceJob): boolean {
        return job.moods.some((m) => m.status === 'Pending');
    }

    private pollJob(baseVoiceId: string): void {
        setTimeout(() => {
            this.service.getJob(baseVoiceId).pipe(first()).subscribe((job) => {
                this.jobs[baseVoiceId] = job;
                if (this.jobActive(job)) this.pollJob(baseVoiceId);
                else this.load(); // terminal — refresh the variant list so new moods appear
            });
        }, 5000);
    }
}
