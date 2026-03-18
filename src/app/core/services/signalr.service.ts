import { Injectable, inject } from '@angular/core';
import { UrlService } from './url.service';
import { HubConnectionBuilder, HubConnectionState, HttpTransportType, LogLevel, HubConnection, IRetryPolicy, RetryContext } from '@microsoft/signalr';
import { SessionService } from './authentication/session.service';
import { Subject } from 'rxjs';

const RETRY_DELAYS_MS = [0, 1000, 2000, 5000, 5000, 10000, 10000, 30000];
const MAX_RETRY_DELAY_MS = 30000;
const FALLBACK_RECONNECT_INTERVAL_MS = 5000;

class IndefiniteRetryPolicy implements IRetryPolicy {
    nextRetryDelayInMilliseconds(retryContext: RetryContext): number {
        return RETRY_DELAYS_MS[retryContext.previousRetryCount] ?? MAX_RETRY_DELAY_MS;
    }
}

@Injectable()
export class SignalRService {
    readonly urls = inject(UrlService);
    private sessionService = inject(SessionService);

    connect(endpoint: string): ConnectionContainer {
        const reconnectEvent = new Subject<void>();
        const connection = new HubConnectionBuilder()
            .withUrl(`${this.urls.apiUrl}/hub/${endpoint}`, {
                accessTokenFactory: () => {
                    return this.sessionService.getSessionToken();
                },
                transport: HttpTransportType.WebSockets,
                logger: LogLevel.None
            })
            .withAutomaticReconnect(new IndefiniteRetryPolicy())
            .build();
        const container = new ConnectionContainer(connection, reconnectEvent);
        connection.onreconnected(() => {
            reconnectEvent.next();
        });
        container.connected = this.startConnection(container);
        container.connected.then(() => {
            connection.onclose(() => {
                container.reconnectIntervalId = setInterval(() => {
                    if (connection.state === HubConnectionState.Connected) {
                        clearInterval(container.reconnectIntervalId);
                        container.reconnectIntervalId = undefined;
                        reconnectEvent.next();
                        return;
                    }
                    connection
                        .start()
                        .then(() => {
                            clearInterval(container.reconnectIntervalId);
                            container.reconnectIntervalId = undefined;
                            reconnectEvent.next();
                        })
                        .catch(() => {});
                }, FALLBACK_RECONNECT_INTERVAL_MS);
            });
        });
        return container;
    }

    private startConnection(container: ConnectionContainer): Promise<void> {
        return new Promise<void>((resolve) => {
            const connectFunction = () => {
                container.connection
                    .start()
                    .then(() => {
                        clearTimeout(container.connectTimeoutId as ReturnType<typeof setTimeout>);
                        container.connectTimeoutId = undefined;
                        resolve();
                    })
                    .catch(() => {
                        container.connectTimeoutId = setTimeout(connectFunction, FALLBACK_RECONNECT_INTERVAL_MS);
                    });
            };
            container.connectTimeoutId = setTimeout(connectFunction, 0);
        });
    }
}

export class ConnectionContainer {
    connection: HubConnection;
    reconnectEvent: Subject<void>;
    reconnectIntervalId: ReturnType<typeof setInterval> | undefined;
    connectTimeoutId: ReturnType<typeof setTimeout> | undefined;
    connected: Promise<void> = Promise.resolve();

    constructor(connection: HubConnection, reconnectEvent: Subject<void>) {
        this.connection = connection;
        this.reconnectEvent = reconnectEvent;
    }

    dispose() {
        if (this.reconnectIntervalId !== undefined) {
            clearInterval(this.reconnectIntervalId);
            this.reconnectIntervalId = undefined;
        }
        if (this.connectTimeoutId !== undefined) {
            clearTimeout(this.connectTimeoutId);
            this.connectTimeoutId = undefined;
        }
        this.reconnectEvent.complete();
    }
}
