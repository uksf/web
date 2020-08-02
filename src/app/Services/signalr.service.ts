import { Injectable, EventEmitter } from '@angular/core';
import { UrlService } from './url.service';
import { HubConnectionBuilder, HubConnectionState, HttpTransportType, LogLevel, HubConnection } from '@aspnet/signalr';
import { SessionService } from './Authentication/session.service';

@Injectable()
export class SignalRService {
    constructor(public readonly urls: UrlService, private sessionService: SessionService) {}

    connect(endpoint: String): ConnectionContainer {
        const reconnectEvent = new EventEmitter();
        const connection = new HubConnectionBuilder()
            .withUrl(`${this.urls.apiUrl}/hub/${endpoint}`, {
                accessTokenFactory: () => {
                    return this.sessionService.getSessionToken(); // TODO: detect when token has been refreshed
                },
                transport: HttpTransportType.WebSockets,
                logger: LogLevel.None,
            })
            .build();
        this.waitForConnection(connection).then(() => {
            connection.onclose((error) => {
                if (error) {
                    const reconnect = setInterval(() => {
                        if (connection.state === HubConnectionState.Connected) {
                            clearInterval(reconnect);
                            reconnectEvent.emit();
                            return;
                        }
                        connection
                            .start()
                            .then(() => {
                                clearInterval(reconnect);
                                reconnectEvent.emit();
                            })
                            .catch(() => {
                                // console.log(`Failed to re-connect to SignalR hub: ${endpoint}`);
                            });
                    }, 5000);
                }
            });
        });
        return new ConnectionContainer(connection, reconnectEvent);
    }

    private waitForConnection(connection: HubConnection): Promise<void> {
        return new Promise<void>((resolve) => {
            const connectFunction = function () {
                connection
                    .start()
                    .then(() => {
                        clearTimeout(connectTimeout);
                        resolve();
                    })
                    .catch(() => {
                        connectTimeout = setTimeout(connectFunction, 5000);
                    });
            };
            let connectTimeout = setTimeout(connectFunction, 0);
        });
    }
}

export class ConnectionContainer {
    connection: HubConnection;
    reconnectEvent: EventEmitter<any>;

    constructor(connection: HubConnection, reconnectEvent: EventEmitter<any>) {
        this.connection = connection;
        this.reconnectEvent = reconnectEvent;
    }
}
