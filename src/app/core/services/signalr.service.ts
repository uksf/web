import { Injectable } from '@angular/core';
import { UrlService } from './url.service';
import { HubConnectionBuilder, HubConnectionState, HttpTransportType, LogLevel, HubConnection } from '@microsoft/signalr';
import { SessionService } from './authentication/session.service';
import { Subject } from 'rxjs';

@Injectable()
export class SignalRService {
    constructor(public readonly urls: UrlService, private sessionService: SessionService) {}

    connect(endpoint: String): ConnectionContainer {
        const reconnectEvent = new Subject<void>();
        const connection = new HubConnectionBuilder()
            .withUrl(`${this.urls.apiUrl}/hub/${endpoint}`, {
                accessTokenFactory: () => {
                    return this.sessionService.getSessionToken();
                },
                transport: HttpTransportType.WebSockets,
                logger: LogLevel.None,
            })
            .withAutomaticReconnect()
            .build();
        const container = new ConnectionContainer(connection, reconnectEvent);
        this.waitForConnection(container).then(() => {
            connection.onclose((error) => {
                if (error) {
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
                    }, 5000);
                }
            });
        });
        return container;
    }

    private waitForConnection(container: ConnectionContainer): Promise<void> {
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
                        container.connectTimeoutId = setTimeout(connectFunction, 5000);
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
