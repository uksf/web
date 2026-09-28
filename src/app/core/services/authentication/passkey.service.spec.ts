import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { PasskeyService, isPasskeyCancelled, toArrayBuffer, toBase64Url } from './passkey.service';
import { UrlService } from '../url.service';

const bytes = (...values: number[]) => new Uint8Array(values).buffer;

describe('PasskeyService', () => {
    let service: PasskeyService;
    let mockHttp: any;
    let mockCredentials: any;

    beforeEach(() => {
        mockHttp = { post: vi.fn(), get: vi.fn(), delete: vi.fn() };
        mockCredentials = { get: vi.fn(), create: vi.fn() };
        vi.stubGlobal('navigator', { credentials: mockCredentials });
        TestBed.configureTestingModule({
            providers: [PasskeyService, { provide: HttpClient, useValue: mockHttp }, { provide: UrlService, useValue: { apiUrl: 'http://api' } }]
        });
        service = TestBed.inject(PasskeyService);
    });

    afterEach(() => vi.unstubAllGlobals());

    it('round-trips base64url without padding', () => {
        const encoded = toBase64Url(bytes(251, 255, 191, 0, 1));

        expect(encoded).toBe('-_-_AAE');
        expect(new Uint8Array(toArrayBuffer(encoded))).toEqual(new Uint8Array([251, 255, 191, 0, 1]));
    });

    it('treats a dismissed prompt as cancelled', () => {
        expect(isPasskeyCancelled(new DOMException('', 'NotAllowedError'))).toBe(true);
        expect(isPasskeyCancelled(new DOMException('', 'AbortError'))).toBe(true);
        expect(isPasskeyCancelled(new DOMException('', 'SecurityError'))).toBe(false);
        expect(isPasskeyCancelled({ error: 'api' })).toBe(false);
    });

    it('decodes sign-in options and encodes the assertion as WebAuthn JSON', async () => {
        mockHttp.post.mockReturnValue(of({ flowId: 'flow', options: { challenge: 'AQI', rpId: 'uk-sf.co.uk', allowCredentials: [], userVerification: 'required' } }));
        mockCredentials.get.mockResolvedValue({
            id: 'AwQ',
            rawId: bytes(3, 4),
            type: 'public-key',
            getClientExtensionResults: () => ({}),
            response: { clientDataJSON: bytes(5), authenticatorData: bytes(6), signature: bytes(7), userHandle: bytes(8) }
        });
        const signal = new AbortController().signal;

        const result = await service.getAssertion('conditional', signal);

        expect(mockHttp.post).toHaveBeenCalledWith('http://api/auth/passkey/options', {});
        const request = mockCredentials.get.mock.calls[0][0];
        expect(request.mediation).toBe('conditional');
        expect(request.signal).toBe(signal);
        expect(new Uint8Array(request.publicKey.challenge)).toEqual(new Uint8Array([1, 2]));
        expect(result).toEqual({
            flowId: 'flow',
            credential: {
                id: 'AwQ',
                rawId: 'AwQ',
                type: 'public-key',
                clientExtensionResults: {},
                response: { clientDataJSON: 'BQ', authenticatorData: 'Bg', signature: 'Bw', userHandle: 'CA' }
            }
        });
    });

    it('decodes creation options and drops transports the API does not know', async () => {
        mockHttp.post.mockReturnValue(
            of({
                flowId: 'flow',
                options: { challenge: 'AQI', user: { id: 'CQ', name: 'a@b.com', displayName: 'A B' }, excludeCredentials: [{ id: 'Cg', type: 'public-key' }] }
            })
        );
        mockCredentials.create.mockResolvedValue({
            id: 'Cw',
            rawId: bytes(11),
            type: 'public-key',
            getClientExtensionResults: () => ({ credProps: { rk: true } }),
            response: { clientDataJSON: bytes(5), attestationObject: bytes(12), getTransports: () => ['internal', 'hybrid', 'cable'] }
        });

        const result = await service.createForNewAccount({ email: 'a@b.com', firstName: 'A', lastName: 'B' });

        const request = mockCredentials.create.mock.calls[0][0].publicKey;
        expect(new Uint8Array(request.user.id)).toEqual(new Uint8Array([9]));
        expect(new Uint8Array(request.excludeCredentials[0].id)).toEqual(new Uint8Array([10]));
        expect(result.credential.response).toEqual({ clientDataJSON: 'BQ', attestationObject: 'DA', transports: ['internal', 'hybrid'] });
        expect(result.credential.clientExtensionResults).toEqual({ credProps: { rk: true } });
    });
});
