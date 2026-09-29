import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject } from 'rxjs';
import { NpcSamplePlayer } from './npc-sample-player';

describe('NpcSamplePlayer', () => {
    let audio: { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        audio = { play: vi.fn().mockResolvedValue(undefined), pause: vi.fn() };
        (globalThis as unknown as { Audio: unknown }).Audio = vi.fn(function () {
            return audio;
        });
        URL.createObjectURL = vi.fn().mockReturnValue('blob:x');
        URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
        delete (globalThis as unknown as { Audio?: unknown }).Audio;
    });

    it('ignores a late failure for a sample the user has moved on from', () => {
        const player = new NpcSamplePlayer();
        const first = new Subject<Blob>();
        const onError = vi.fn();

        player.toggle('a', first, onError);
        player.toggle('b', of(new Blob(['x'])), onError);
        first.error(new Error('404'));

        expect(player.playingId).toBe('b');
        expect(onError).not.toHaveBeenCalled();
    });
});
