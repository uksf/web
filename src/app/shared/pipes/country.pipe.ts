import { Pipe, PipeTransform } from '@angular/core';
import { CountryPickerService } from '@app/shared/services/country-picker/country-picker.service';

@Pipe({
    name: 'countryName',
    standalone: false
})
export class CountryName implements PipeTransform {
    transform(value: string): string {
        return CountryPickerService.countries.find((x) => x.value === value).name;
    }
}

@Pipe({
    name: 'countryImage',
    standalone: false
})
export class CountryImage implements PipeTransform {
    transform(value: string): string {
        return 'assets/dist/flags/' + CountryPickerService.countries.find((x) => x.value === value).code.toLowerCase() + '.svg';
    }
}
