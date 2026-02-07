import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationService } from './application.service';
import { of } from 'rxjs';

describe('ApplicationService', () => {
    let service: ApplicationService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of(null)),
            post: vi.fn().mockReturnValue(of(null)),
            put: vi.fn().mockReturnValue(of(null)),
        };
        service = new ApplicationService(mockHttpClient, { apiUrl: 'http://localhost:5500' } as any);
    });

    it('submitApplication calls correct endpoint', () => {
        service.submitApplication('acc1', '"details"').subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/accounts/acc1/application',
            '"details"',
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('updateApplication calls correct endpoint', () => {
        service.updateApplication('acc1', '{"field":"value"}').subscribe();
        expect(mockHttpClient.put).toHaveBeenCalledWith(
            'http://localhost:5500/accounts/acc1/application',
            '{"field":"value"}',
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('validateEmailCode calls correct endpoint', () => {
        const body = { email: 'test@test.com', code: 'abc123' };
        service.validateEmailCode(body).subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/accounts/code',
            body,
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('resendEmailCode calls correct endpoint', () => {
        service.resendEmailCode().subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/accounts/resend-email-code', {});
    });

    it('getNations calls correct endpoint', () => {
        service.getNations().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/accounts/nations');
    });

    it('checkEmailExists calls correct endpoint', () => {
        service.checkEmailExists('test@test.com').subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/accounts/exists?check=test@test.com');
    });
});
