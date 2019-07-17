import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class CountryPickerService {
    public static countries: ICountry[];

    constructor(private httpClient: HttpClient) { }

    async load() {
        return new Promise((resolve, reject) => {
            let countries: ICountry[] = [];
            this.httpClient.get('assets/dist/countries.json').subscribe((response: any[]) => {
                response.forEach(countryObj => {
                    const country: ICountry = { value: countryObj.cca3, name: countryObj.name.common }
                    countries.push(country);
                });
                countries = countries.sort((a: ICountry, b: ICountry) => {
                    return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
                });
                let uk = null;
                let index = -1;
                for (let i = 0, len = countries.length; i < len; i++) {
                    if (countries[i].name === 'United Kingdom') {
                        uk = countries[i];
                        index = i;
                        break;
                    }
                }
                countries.splice(index, 1);
                countries.unshift(uk);
                CountryPickerService.countries = countries;
                resolve();
            }, () => {
                reject('Failed to load country data');
            });
        });
    }
}

export interface ICountry {
    value;
    name;
}
