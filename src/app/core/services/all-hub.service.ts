import { Injectable } from '@angular/core';
import { HubServiceBase } from './hub-service-base';

@Injectable({ providedIn: 'root' })
export class AllHubService extends HubServiceBase {
    protected readonly endpoint = 'all';
}
