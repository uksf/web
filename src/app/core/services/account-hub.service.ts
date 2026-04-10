import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { HubConnectionFactory } from './hub-connection-factory';
import { HubConnectionHandle } from './hub-connection-handle';
import { AccountService } from './account.service';
import { Account } from '@app/shared/models/account';

@Injectable({ providedIn: 'root' })
export class AccountHubService implements OnDestroy {
    private factory = inject(HubConnectionFactory);
    private accountService = inject(AccountService);

    private handle: HubConnectionHandle | null = null;
    private reconnectSubscription: Subscription | null = null;
    private connectGeneration = 0;
    private pendingHandlers: { event: string; callback: (...args: unknown[]) => void }[] = [];

    private readonly _reconnected$ = new Subject<void>();
    readonly reconnected$: Observable<void> = this._reconnected$.asObservable();

    connect(): void {
        this.cleanupConnection();
        this.connectGeneration++;
        const generation = this.connectGeneration;

        this.waitForId().then((id) => {
            if (generation !== this.connectGeneration) {
                return;
            }
            this.handle = this.factory.connect(`account?userId=${id}`);
            this.reconnectSubscription = this.handle.reconnected$.subscribe({
                next: () => this._reconnected$.next()
            });

            for (const { event, callback } of this.pendingHandlers) {
                this.handle.on(event, callback);
            }
            this.pendingHandlers = [];
        });
    }

    disconnect(): void {
        this.cleanupConnection();
    }

    on(event: string, callback: (...args: unknown[]) => void): void {
        if (this.handle) {
            this.handle.on(event, callback);
        } else {
            this.pendingHandlers.push({ event, callback });
        }
    }

    off(event: string, callback?: (...args: unknown[]) => void): void {
        this.handle?.off(event, callback);
        this.pendingHandlers = this.pendingHandlers.filter(
            (h) => !(h.event === event && (!callback || h.callback === callback))
        );
    }

    ngOnDestroy(): void {
        this.cleanupConnection();
        this._reconnected$.complete();
    }

    private cleanupConnection(): void {
        this.connectGeneration++;
        this.reconnectSubscription?.unsubscribe();
        this.reconnectSubscription = null;
        this.pendingHandlers = [];
        if (this.handle) {
            this.handle.disconnect();
            this.handle = null;
        }
    }

    private waitForId(): Promise<string> {
        if (this.accountService.account?.id) {
            return Promise.resolve(this.accountService.account.id);
        }

        return new Promise<string>((resolve) => {
            const subscription = this.accountService.accountChange$.subscribe({
                next: (account: Account) => {
                    if (account?.id) {
                        subscription.unsubscribe();
                        resolve(account.id);
                    }
                }
            });
        });
    }
}
