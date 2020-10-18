import { Pipe, PipeTransform } from '@angular/core';
import { CountryPickerService } from 'app/Services/CountryPicker/country-picker.service';

@Pipe({ name: 'countryName' })
export class CountryName implements PipeTransform {
    transform(value: string): string {
        return CountryPickerService.countries.find((x) => x.value === value).name;
    }
}

@Pipe({ name: 'countryImage' })
export class CountryImage implements PipeTransform {
    transform(value: string): string {
        return 'assets/dist/flags/' + CountryPickerService.countries.find((x) => x.value === value).code.toLowerCase() + '.svg';
    }
}
