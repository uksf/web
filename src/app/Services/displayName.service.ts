import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';

@Injectable()
export class DisplayNameService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getName(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (!id) {
                reject();
                return;
            }

            this.httpClient.get(this.urls.apiUrl + `/displayName/${id}`).subscribe(
                (name: string) => {
                    if (name) {
                        resolve(name);
                    } else {
                        reject();
                    }
                },
                (error) => {
                    this.urls.errorWrapper('Failed to get displayname', error);
                    reject();
                }
            );
        });
    }
}
