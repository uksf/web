import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment-timezone';

@Pipe({ name: 'zonedTime' })
export class ZonedTime implements PipeTransform {
    transform(time: number, zone: string, short = false): string {
        let zonedTime = moment(time);

        if (zone !== 'Local') {
            zonedTime = zonedTime.tz(zone);
        }

        return short ? zonedTime.format('HH:mm') : zonedTime.format('HH:mm:ss');
    }
}
