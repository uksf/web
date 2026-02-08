import { describe, it, expect, beforeEach } from 'vitest';
import { CountryName, CountryImage } from './country.pipe';
import { CountryPickerService } from '@app/shared/services/country-picker/country-picker.service';

describe('CountryName pipe', () => {
    const pipe = new CountryName();

    beforeEach(() => {
        CountryPickerService.countries = [
            { value: 'gb', name: 'United Kingdom', code: 'GB' },
            { value: 'us', name: 'United States', code: 'US' },
            { value: 'de', name: 'Germany', code: 'DE' }
        ];
    });

    it('should transform country value to name', () => {
        expect(pipe.transform('gb')).toBe('United Kingdom');
    });

    it('should find correct country for different values', () => {
        expect(pipe.transform('us')).toBe('United States');
        expect(pipe.transform('de')).toBe('Germany');
    });
});

describe('CountryImage pipe', () => {
    const pipe = new CountryImage();

    beforeEach(() => {
        CountryPickerService.countries = [
            { value: 'gb', name: 'United Kingdom', code: 'GB' },
            { value: 'us', name: 'United States', code: 'US' }
        ];
    });

    it('should transform country value to flag image path', () => {
        expect(pipe.transform('gb')).toBe('assets/dist/flags/gb.svg');
    });

    it('should lowercase the country code in the path', () => {
        expect(pipe.transform('us')).toBe('assets/dist/flags/us.svg');
    });
});
