import { Directive, inject, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { HubConnectionFactory } from './hub-connection-factory';
import { HubConnectionHandle } from './hub-connection-handle';

@Directive()
export abstract class HubServiceBase implements OnDestroy {
    private factory = inject(HubConnectionFactory);
    private handle: HubConnectionHandle | null = null;
    private reconnectSubscription: Subscription | null = null;
    private refCount = 0;

    private readonly _reconnected$ = new Subject<void>();
    readonly reconnected$: Observable<void> = this._reconnected$.asObservable();

    protected abstract readonly endpoint: string;

    get connected(): Promise<void> {
        return this.handle?.connected ?? Promise.resolve();
    }

    get connectionId(): string | null {
        return this.handle?.connectionId ?? null;
    }

    connect(): void {
        this.refCount++;
        if (this.handle) {
            return;
        }
        this.handle = this.factory.connect(this.endpoint);
        this.reconnectSubscription = this.handle.reconnected$.subscribe({
            next: () => this._reconnected$.next()
        });
    }

    disconnect(): void {
        this.refCount = Math.max(0, this.refCount - 1);
        if (this.refCount > 0 || !this.handle) {
            return;
        }
        this.reconnectSubscription?.unsubscribe();
        this.reconnectSubscription = null;
        this.handle.disconnect();
        this.handle = null;
    }

    on(event: string, callback: (...args: unknown[]) => void): void {
        this.handle?.on(event, callback);
    }

    off(event: string, callback?: (...args: unknown[]) => void): void {
        this.handle?.off(event, callback);
    }

    invoke(method: string, ...args: unknown[]): Promise<unknown> {
        if (!this.handle) {
            return Promise.reject(new Error('Not connected'));
        }
        return this.handle.invoke(method, ...args);
    }

    ngOnDestroy(): void {
        this._reconnected$.complete();
        this.reconnectSubscription?.unsubscribe();
        this.reconnectSubscription = null;
        if (this.handle) {
            this.handle.disconnect();
            this.handle = null;
        }
        this.refCount = 0;
    }
}
