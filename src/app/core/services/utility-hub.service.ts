import { Injectable } from '@angular/core';
import { HubServiceBase } from './hub-service-base';

@Injectable({ providedIn: 'root' })
export class UtilityHubService extends HubServiceBase {
    protected readonly endpoint = 'utility';
}
