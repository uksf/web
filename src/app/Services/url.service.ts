import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class UrlService {
    public apiUrl = 'https://api.uk-sf.co.uk';
    public steamUrl = 'https://integrations.uk-sf.co.uk';

    constructor(@Inject(DOCUMENT) private document: any) {
        if (this.document.location.hostname === 'localhost') {
            this.apiUrl = 'http://localhost:5000';
            this.steamUrl = 'http://localhost:5100';
        }
    }

    public errorWrapper = function (_, error) {
        if (error.error instanceof Error) {
            error = 'An error occurred:' + error.error.message;
        } else {
            console.log(error);
            try {
                error = error.error.message;
            } catch (err) {
                error = error.message;
            }
            console.log(error);
        }
    };
}
