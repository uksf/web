import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment-timezone';

@Pipe({ name: 'zonedTime' })
export class ZonedTime implements PipeTransform {
    transform(time: Date, zone: string, short = false): string {
        let zonedTime = zone === 'Local' ? moment() : moment(time).tz(zone);
        return short ? zonedTime.format('HH:mm') : zonedTime.format('HH:mm:ss');
    }
}
