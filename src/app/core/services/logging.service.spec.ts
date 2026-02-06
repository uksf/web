import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
    let service: LoggingService;
    let consoleSpy: { log: any; warn: any; error: any; debug: any };

    beforeEach(() => {
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {}),
            debug: vi.spyOn(console, 'debug').mockImplementation(() => {})
        };
        service = new LoggingService();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('logs info messages with prefix', () => {
        service.info('PermissionsService', 'Token refreshed');

        expect(consoleSpy.log).toHaveBeenCalledWith('[UKSF] [PermissionsService]', 'Token refreshed');
    });

    it('logs warn messages with prefix', () => {
        service.warn('AuthService', 'Session expiring');

        expect(consoleSpy.warn).toHaveBeenCalledWith('[UKSF] [AuthService]', 'Session expiring');
    });

    it('logs error messages with prefix', () => {
        service.error('PermissionsService', 'Refresh failed', 'some reason');

        expect(consoleSpy.error).toHaveBeenCalledWith('[UKSF] [PermissionsService]', 'Refresh failed', 'some reason');
    });

    it('logs debug messages with prefix', () => {
        service.debug('AppSettings', { key: 'value' });

        expect(consoleSpy.debug).toHaveBeenCalledWith('[UKSF] [AppSettings]', { key: 'value' });
    });

    it('handles multiple data arguments', () => {
        service.info('Test', 'message', 'extra1', 'extra2');

        expect(consoleSpy.log).toHaveBeenCalledWith('[UKSF] [Test]', 'message', 'extra1', 'extra2');
    });
});
