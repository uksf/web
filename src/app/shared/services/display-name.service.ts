import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';

@Injectable()
export class DisplayNameService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    getName(id: string) {
        return new Promise<string>((resolve, reject) => {
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
