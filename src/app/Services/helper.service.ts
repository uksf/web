import { Injectable } from '@angular/core';

@Injectable()
export class HelperService {
    public nextFrame(callback: () => void) {
        setTimeout(() => {
            callback();
        }, 1);
    }
}
