import { Injectable } from '@angular/core';
import { HubServiceBase } from '@app/core/services/hub-service-base';

@Injectable({ providedIn: 'root' })
export class CommandRequestsHubService extends HubServiceBase {
    protected readonly endpoint = 'commandRequests';
}
