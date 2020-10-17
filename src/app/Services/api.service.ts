import { Injectable } from '@angular/core';
import { UrlService } from './url.service';
import { HttpClient } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Injectable()
export class ApiService {
    constructor(public readonly httpClient: HttpClient, public readonly urls: UrlService) {}

    public sendRequest(request, responseHandler, errorMessage) {
        request().subscribe(responseHandler, (x) => this.urls.errorWrapper(errorMessage, x));
    }

    public submitForm(url: string, form: FormGroup, dialog: MatDialogRef<any> = null) {
        if (!form.valid) {
            return;
        }
        this.sendRequest(
            () => {
                return this.httpClient.post(this.urls.apiUrl + url, form.value);
            },
            () => {
                if (dialog != null) {
                    dialog.close();
                }
            },
            'submission of form failed for ' + url
        );
    }
}
