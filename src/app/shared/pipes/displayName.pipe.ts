import { Pipe, PipeTransform } from '@angular/core';
import { DisplayNameService } from '@app/shared/services/display-name.service';

@Pipe({ standalone: true, name: 'displayName' })
export class DisplayName implements PipeTransform {
    constructor(private displayNameService: DisplayNameService) {}

    transform(value: string) {
        return this.displayNameService
            .getName(value)
            .then((name: string) => name)
            .catch(() => '');
    }
}
