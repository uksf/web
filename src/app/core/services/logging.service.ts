import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggingService {
    info(context: string, ...data: unknown[]) {
        console.log(`[UKSF] [${context}]`, ...data);
    }

    warn(context: string, ...data: unknown[]) {
        console.warn(`[UKSF] [${context}]`, ...data);
    }

    error(context: string, ...data: unknown[]) {
        console.error(`[UKSF] [${context}]`, ...data);
    }

    debug(context: string, ...data: unknown[]) {
        console.debug(`[UKSF] [${context}]`, ...data);
    }
}
