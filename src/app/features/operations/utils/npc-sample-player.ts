import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';

/// Plays one voice sample at a time. Pressing play on the playing sample stops it.
export class NpcSamplePlayer {
    playingId: string | null = null;
    private audio: HTMLAudioElement | null = null;
    private url: string | null = null;

    toggle(id: string, load: Observable<Blob>, onError: () => void): void {
        if (this.playingId === id) {
            this.stop();
            return;
        }
        this.stop();
        this.playingId = id;
        load.pipe(first()).subscribe({
            next: (blob) => {
                if (this.playingId !== id) return;
                this.url = URL.createObjectURL(blob);
                this.audio = new Audio(this.url);
                this.audio.onended = () => this.stop();
                this.audio.play().catch(() => this.stop());
            },
            error: () => {
                this.stop();
                onError();
            }
        });
    }

    stop(): void {
        this.audio?.pause();
        this.audio = null;
        if (this.url) URL.revokeObjectURL(this.url);
        this.url = null;
        this.playingId = null;
    }
}
