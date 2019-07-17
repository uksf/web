import { Injectable } from '@angular/core';
import { Message } from 'primeng/components/common/api';

@Injectable()
export class NotificationsService {
    msgs: Message[] = [];

    constructor() { }

    addSingle(input) {
        this.msgs = [];
        this.msgs.push(input);
    }
}
