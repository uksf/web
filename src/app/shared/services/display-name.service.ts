import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';

@Injectable()
export class DisplayNameService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getName(id: string) {
        return new Promise<string>((resolve: (value: PromiseLike<string> | string) => void, reject: (reason?: any) => void) => {
            if (!id) {
                reject();
                return;
            }

            this.httpClient
                .get(this.urls.apiUrl + `/displayName/${id}`, {
                    responseType: 'text'
                })
                .subscribe({
                    next: (name: string) => {
                        if (name) {
                            resolve(name);
                        } else {
                            reject();
                        }
                    },
                    error: () => {
                        reject();
                    }
                });
        });
    }
}
