import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConnectionContainer } from './signalr.service';

export class HubConnectionHandle {
    private readonly _reconnected$ = new Subject<void>();
    private readonly _destroy$ = new Subject<void>();
    readonly reconnected$: Observable<void> = this._reconnected$.asObservable();
    readonly connected: Promise<void>;

    private container: ConnectionContainer | null;

    constructor(container: ConnectionContainer) {
        this.container = container;
        this.connected = container.connected;
        container.reconnectEvent.pipe(takeUntil(this._destroy$)).subscribe({
            next: () => this._reconnected$.next()
        });
    }

    get connectionId(): string | null {
        return this.container?.connection.connectionId ?? null;
    }

    on(event: string, callback: (...args: any[]) => void): void {
        this.container?.connection.on(event, callback);
    }

    off(event: string, callback?: (...args: any[]) => void): void {
        if (callback) {
            this.container?.connection.off(event, callback);
        } else {
            this.container?.connection.off(event);
        }
    }

    invoke(method: string, ...args: any[]): Promise<any> {
        if (!this.container) {
            return Promise.reject(new Error('Connection is disconnected'));
        }
        return this.container.connection.invoke(method, ...args);
    }

    disconnect(): void {
        if (!this.container) {
            return;
        }
        this._destroy$.next();
        this._destroy$.complete();
        this._reconnected$.complete();
        this.container.connection.stop();
        this.container.dispose();
        this.container = null;
    }
}
