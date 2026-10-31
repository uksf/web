import { Component, ElementRef, inject, Injector, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelContent, MatExpansionPanelHeader } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxPermissionsService } from 'ngx-permissions';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, first, takeUntil } from 'rxjs/operators';
import { AccountService } from '@app/core/services/account.service';
import { DestroyableComponent } from '@app/shared/components/destroyable/destroyable.component';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '@app/shared/components/content-areas/main-content-area/main-content-area.component';
import { FlexFillerComponent } from '@app/shared/components/elements/flex-filler/flex-filler.component';
import { TextInputBoxedComponent } from '@app/shared/components/elements/text-input-boxed/text-input-boxed.component';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { NpcVoiceUploadData, NpcVoiceUploadModalComponent, NpcVoiceUploadResult } from '../../modals/npc-voice-upload-modal/npc-voice-upload-modal.component';
import { NpcMood, NpcVoice, NpcVoiceJob } from '../../models/npc-voice';
import { NpcVoicesService } from '../../services/npc-voices.service';
import { UrlQueryState } from '@app/shared/utils/url-query-state';
import { groupName, groupVoices, isGenerating, matchesFilter, moodLabel, NpcMoodView, NpcVoiceGroup } from '../../utils/npc-voice-groups';
import { NpcSamplePlayer } from '../../utils/npc-sample-player';

const POLL_MS = 5000;

@Component({
    selector: 'app-operations-npcs',
    templateUrl: './operations-npcs.component.html',
    styleUrls: ['./operations-npcs.component.scss'],
    imports: [
        DatePipe,
        FormsModule,
        MatButton,
        MatIconButton,
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelContent,
        MatIcon,
        MatProgressSpinner,
        MatTooltip,
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        FlexFillerComponent,
        TextInputBoxedComponent
    ]
})
export class OperationsNpcsComponent extends DestroyableComponent implements OnInit, OnDestroy {
    private service = inject(NpcVoicesService);
    private dialog = inject(MatDialog);
    private clipboard = inject(Clipboard);
    private accountService = inject(AccountService);
    private permissions = inject(NgxPermissionsService);
    private injector = inject(Injector);

    @ViewChild('moodUploader') moodUploader!: ElementRef<HTMLInputElement>;

    voices: NpcVoice[] | null = null;
    jobs: Record<string, NpcVoiceJob> = {};
    groups: NpcVoiceGroup[] = [];
    filtered: NpcVoiceGroup[] = [];
    private urlState = new UrlQueryState();
    filter = this.urlState.string('filter');
    copiedId: string | null = null;
    loadFailed = false;
    player = new NpcSamplePlayer();
    busy = new Set<string>();

    readonly groupName = groupName;
    readonly moodLabel = moodLabel;

    private moodUploadTarget: { group: NpcVoiceGroup; mood: NpcMood } | null = null;
    private polling = false;

    ngOnInit(): void {
        this.load();
    }

    override ngOnDestroy(): void {
        this.player.stop();
        super.ngOnDestroy();
    }

    canManage(voice: NpcVoice | null): boolean {
        if (!voice) return !!this.permissions.getPermission('ADMIN');
        return voice.ownerId === this.accountService.account?.id || !!this.permissions.getPermission('ADMIN');
    }

    generating(group: NpcVoiceGroup): boolean {
        return isGenerating(this.jobs[group.voiceId]);
    }

    missingCount(group: NpcVoiceGroup): number {
        return group.moods.filter((m) => m.state === 'missing' || m.state === 'failed').length;
    }

    readyCount(group: NpcVoiceGroup): number {
        return group.moods.filter((m) => m.state === 'ready').length;
    }

    moodTooltip(mood: NpcMoodView): string {
        const label = moodLabel(mood.mood);
        switch (mood.state) {
            case 'ready':
                return `${label}: ready`;
            case 'generating':
                return `${label}: generating. This waits for the voice generator to be online.`;
            case 'failed':
                return `${label}: generation failed${mood.error ? ` (${mood.error})` : ''}`;
            default:
                return `${label}: missing. The NPC uses the source sample for this mood.`;
        }
    }

    applyFilter(): void {
        this.urlState.set({ filter: this.filter });
        this.filtered = this.groups.filter((g) => matchesFilter(g, this.filter));
    }

    openUpload(): void {
        this.dialog
            .open<NpcVoiceUploadModalComponent, NpcVoiceUploadData, NpcVoiceUploadResult>(NpcVoiceUploadModalComponent, {
                injector: this.injector,
                data: { takenIds: (this.voices ?? []).map((v) => v.voiceId) }
            })
            .afterClosed()
            .pipe(first())
            .subscribe((result) => {
                if (!result) return;
                if (result.generateMoods) {
                    this.generate(result.voice.voiceId, [], true);
                } else {
                    this.load();
                }
            });
    }

    copy(voiceId: string, event: Event): void {
        event.stopPropagation();
        this.clipboard.copy(voiceId);
        this.copiedId = voiceId;
        timer(1500)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => (this.copiedId = this.copiedId === voiceId ? null : this.copiedId));
    }

    play(voice: NpcVoice, event?: Event): void {
        event?.stopPropagation();
        this.player.toggle(voice.id, this.service.getSample(voice.id), () => this.showError('The sample could not be loaded.'));
    }

    generate(voiceId: string, moods: NpcMood[], reload = false, event?: Event): void {
        event?.stopPropagation();
        this.busy.add(voiceId);
        this.service
            .generateMoods(voiceId, moods)
            .pipe(first())
            .subscribe({
                next: (job) => {
                    this.busy.delete(voiceId);
                    this.jobs[voiceId] = job;
                    if (reload) this.load();
                    else this.regroup();
                    this.poll();
                },
                error: (err) => {
                    this.busy.delete(voiceId);
                    if (reload) this.load();
                    this.showError(err?.error?.error ?? 'Mood generation could not start.');
                }
            });
    }

    recordMood(group: NpcVoiceGroup, mood: NpcMood): void {
        this.moodUploadTarget = { group, mood };
        this.moodUploader.nativeElement.click();
    }

    onMoodFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        const target = this.moodUploadTarget;
        input.value = '';
        this.moodUploadTarget = null;
        if (!file || !target) return;

        const formData = new FormData();
        formData.append('sample', file, file.name);
        formData.append('moodOf', target.group.voiceId);
        formData.append('moodLabel', target.mood);
        this.busy.add(target.group.voiceId);
        this.service
            .upload(formData)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.busy.delete(target.group.voiceId);
                    this.load();
                },
                error: (err) => {
                    this.busy.delete(target.group.voiceId);
                    this.showError(err?.error?.error ?? 'Upload failed.');
                }
            });
    }

    delete(voice: NpcVoice, message: string, event?: Event): void {
        event?.stopPropagation();
        this.dialog
            .open(ConfirmationModalComponent, { data: { message } })
            .afterClosed()
            .pipe(first())
            .subscribe((confirmed) => {
                if (!confirmed) return;
                this.service
                    .delete(voice.id)
                    .pipe(first())
                    .subscribe({ next: () => this.load(), error: () => this.showError('The voice could not be deleted.') });
            });
    }

    deleteVoiceMessage(group: NpcVoiceGroup): string {
        const moods = this.readyCount(group);
        const suffix = moods ? ` and its ${moods} mood${moods === 1 ? '' : 's'}` : '';
        return `Delete '${groupName(group)}'${suffix}? NPCs that use '${group.voiceId}' will fall back to the default voice.`;
    }

    private load(): void {
        this.service
            .getVoices()
            .pipe(first())
            .subscribe({
                error: () => {
                    this.loadFailed = true;
                    this.voices ??= [];
                    this.regroup();
                    this.poll();
                },
                next: (voices) => {
                this.loadFailed = false;
                this.voices = voices;
                const bases = voices.filter((v) => !v.moodOf).map((v) => v.voiceId);
                const requests = bases.map((id) => this.service.getJob(id).pipe(catchError(() => of(null))));
                (requests.length ? forkJoin(requests) : of([])).pipe(first()).subscribe((jobs) => {
                    this.jobs = {};
                    jobs.forEach((job) => job && (this.jobs[job.baseVoiceId] = job));
                    this.regroup();
                    this.poll();
                });
                }
            });
    }

    private regroup(): void {
        this.groups = groupVoices(this.voices ?? [], this.jobs);
        this.applyFilter();
    }

    private poll(): void {
        if (this.polling || !Object.values(this.jobs).some(isGenerating)) return;
        this.polling = true;
        timer(POLL_MS)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.polling = false;
                this.load();
            });
    }

    private showError(message: string): void {
        this.dialog.open(MessageModalComponent, { data: { message } });
    }
}
