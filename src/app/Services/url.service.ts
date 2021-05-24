import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class UrlService {
    public apiUrl = 'https://api.uk-sf.co.uk';

    constructor(@Inject(DOCUMENT) private document: any) {
        if (this.document.location.hostname === 'localhost') {
            this.apiUrl = 'http://localhost:5000';
        }
    }
}
