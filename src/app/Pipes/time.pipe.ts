import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment-timezone';

@Pipe({ name: 'zonedTime' })
export class ZonedTime implements PipeTransform {
    transform(time: number, zone: string, short = false): string {
        const zonedTime = moment(time).tz(zone);
        return short ? zonedTime.format('HH:mm') : zonedTime.format('HH:mm:ss');
    }
}
