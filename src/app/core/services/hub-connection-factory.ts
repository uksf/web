import { Injectable, inject } from '@angular/core';
import { SignalRService } from './signalr.service';
import { HubConnectionHandle } from './hub-connection-handle';

@Injectable({ providedIn: 'root' })
export class HubConnectionFactory {
    private signalrService = inject(SignalRService);

    connect(endpoint: string): HubConnectionHandle {
        const container = this.signalrService.connect(endpoint);
        return new HubConnectionHandle(container);
    }
}
