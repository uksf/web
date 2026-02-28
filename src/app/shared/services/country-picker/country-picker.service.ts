import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class CountryPickerService {
    private httpClient = inject(HttpClient);

    public static countries: ICountry[];

    async load() {
        return new Promise((resolve, reject) => {
            this.httpClient.get('assets/dist/countries.json').subscribe({
                next: (countries: ICountry[]) => {
                    CountryPickerService.countries = countries;
                    resolve(null);
                },
                error: () => {
                    reject('Failed to load country data');
                }
            });
        });
    }
}

export interface ICountry {
    value: string;
    name: string;
    code?: string;
    image?: string;
}
