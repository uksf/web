import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggingService {
    info(context: string, ...data: any[]) {
        console.log(`[UKSF] [${context}]`, ...data);
    }

    warn(context: string, ...data: any[]) {
        console.warn(`[UKSF] [${context}]`, ...data);
    }

    error(context: string, ...data: any[]) {
        console.error(`[UKSF] [${context}]`, ...data);
    }

    debug(context: string, ...data: any[]) {
        console.debug(`[UKSF] [${context}]`, ...data);
    }
}
