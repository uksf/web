import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import Convert from 'ansi-to-html';

@Pipe({
    name: 'ansiToHtml',
    standalone: false
})
export class AnsiToHtmlPipe implements PipeTransform {
    private convert: Convert = new Convert({
        colors: {
            1: '#ff0000',
            2: '#20d18b',
            3: '#f5f543',
            4: '#165ead',
            5: '#e700ff',
            6: '#ff0000',
            7: '#8b00aa',
            8: '#ff0000',
            9: '#ff0000'
        }
    });

    constructor(private sanitizer: DomSanitizer) {}

    transform(value: string) {
        const converted = this.convert.toHtml(value);
        return this.sanitizer.bypassSecurityTrustHtml(converted);
    }
}
