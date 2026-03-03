import { Injectable } from '@angular/core';
import { HubServiceBase } from '@app/core/services/hub-service-base';

@Injectable({ providedIn: 'root' })
export class ServersHubService extends HubServiceBase {
    protected readonly endpoint = 'servers';
}
