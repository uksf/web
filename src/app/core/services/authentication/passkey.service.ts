import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { UrlService } from '../url.service';

export interface PasskeyCredential {
    flowId: string;
    credential: Record<string, unknown>;
}

export interface Passkey {
    id: string;
    credentialId: string;
    name: string;
    created: string;
    lastUsed: string | null;
    isBackedUp: boolean;
}

export interface Passkeys {
    hasPassword: boolean;
    passkeys: Passkey[];
}

interface PasskeyOptions<T> {
    flowId: string;
    options: T;
}

interface CredentialDescriptorJson {
    id: string;
    type: PublicKeyCredentialType;
    transports?: AuthenticatorTransport[];
}

interface CreationOptionsJson extends Omit<PublicKeyCredentialCreationOptions, 'challenge' | 'user' | 'excludeCredentials'> {
    challenge: string;
    user: { id: string; name: string; displayName: string };
    excludeCredentials?: CredentialDescriptorJson[];
}

interface RequestOptionsJson extends Omit<PublicKeyCredentialRequestOptions, 'challenge' | 'allowCredentials'> {
    challenge: string;
    allowCredentials?: CredentialDescriptorJson[];
}

// WebAuthn Level 3 additions that are not in the DOM typings yet
interface PublicKeyCredentialLevel3 {
    getClientCapabilities?: () => Promise<Record<string, boolean>>;
    signalUnknownCredential?: (options: { rpId: string; credentialId: string }) => Promise<void>;
}

// The API rejects transport names outside the WebAuthn Level 3 list
const KNOWN_TRANSPORTS = ['usb', 'nfc', 'ble', 'smart-card', 'hybrid', 'internal'];

export function toArrayBuffer(value: string): ArrayBuffer {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)).buffer;
}

export function toBase64Url(buffer: ArrayBuffer | null): string | null {
    if (!buffer) {
        return null;
    }
    const binary = Array.from(new Uint8Array(buffer), (byte) => String.fromCharCode(byte)).join('');
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function toDescriptors(descriptors: CredentialDescriptorJson[] = []): PublicKeyCredentialDescriptor[] {
    return descriptors.map((descriptor) => ({ ...descriptor, id: toArrayBuffer(descriptor.id) }));
}

function credentialJson(credential: PublicKeyCredential, response: Record<string, unknown>): Record<string, unknown> {
    return {
        id: credential.id,
        rawId: toBase64Url(credential.rawId),
        type: credential.type,
        response,
        clientExtensionResults: credential.getClientExtensionResults?.() ?? {}
    };
}

// A user cancelling or dismissing the browser prompt is not an error worth showing.
export function isPasskeyCancelled(error: unknown): boolean {
    return error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError');
}

@Injectable({ providedIn: 'root' })
export class PasskeyService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    get supported(): boolean {
        return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials;
    }

    async conditionalMediationAvailable(): Promise<boolean> {
        return this.supported && !!PublicKeyCredential.isConditionalMediationAvailable && (await PublicKeyCredential.isConditionalMediationAvailable());
    }

    async getAssertion(mediation?: CredentialMediationRequirement, signal?: AbortSignal): Promise<PasskeyCredential> {
        const { flowId, options } = await firstValueFrom(this.httpClient.post<PasskeyOptions<RequestOptionsJson>>(`${this.urls.apiUrl}/auth/passkey/options`, {}));
        const credential = (await navigator.credentials.get({
            mediation,
            signal,
            publicKey: { ...options, challenge: toArrayBuffer(options.challenge), allowCredentials: toDescriptors(options.allowCredentials) }
        })) as PublicKeyCredential;
        const response = credential.response as AuthenticatorAssertionResponse;

        return {
            flowId,
            credential: credentialJson(credential, {
                clientDataJSON: toBase64Url(response.clientDataJSON),
                authenticatorData: toBase64Url(response.authenticatorData),
                signature: toBase64Url(response.signature),
                userHandle: toBase64Url(response.userHandle)
            })
        };
    }

    async conditionalCreateAvailable(): Promise<boolean> {
        const capabilities = this.supported ? await (PublicKeyCredential as unknown as PublicKeyCredentialLevel3).getClientCapabilities?.() : undefined;
        return !!capabilities?.['conditionalCreate'];
    }

    // After a password sign-in, the password manager that filled the password may save a passkey without a prompt (conditional create).
    // Every failure is silent: most attempts end with the browser declining, which is expected.
    async upgradeAfterPasswordSignIn(): Promise<void> {
        try {
            if (!(await this.conditionalCreateAvailable())) {
                return;
            }
            const { passkeys } = await firstValueFrom(this.list());
            if (passkeys.length > 0) {
                return;
            }
            const credential = await this.create(`${this.urls.apiUrl}/passkeys/options/automatic`, {}, 'conditional');
            await firstValueFrom(this.httpClient.post<Passkey>(`${this.urls.apiUrl}/passkeys`, credential));
        } catch {
            // Declined by the browser, or not possible now
        }
    }

    // Tells the password manager that the site no longer knows this passkey, so it can remove it
    signalUnknownCredential(credentialId: string) {
        if (!this.supported) {
            return;
        }
        (PublicKeyCredential as unknown as PublicKeyCredentialLevel3)
            .signalUnknownCredential?.({ rpId: window.location.hostname, credentialId })
            .catch(() => undefined);
    }

    async createForNewAccount(details: { email: string; firstName: string; lastName: string }): Promise<PasskeyCredential> {
        return this.create(`${this.urls.apiUrl}/accounts/create/passkey/options`, details);
    }

    list(): Observable<Passkeys> {
        return this.httpClient.get<Passkeys>(`${this.urls.apiUrl}/passkeys`);
    }

    async add(): Promise<Passkey> {
        const credential = await this.create(`${this.urls.apiUrl}/passkeys/options`, {});
        return firstValueFrom(this.httpClient.post<Passkey>(`${this.urls.apiUrl}/passkeys`, credential));
    }

    remove(id: string): Observable<void> {
        return this.httpClient.delete<void>(`${this.urls.apiUrl}/passkeys/${id}`);
    }

    private async create(optionsUrl: string, body: object, mediation?: CredentialMediationRequirement): Promise<PasskeyCredential> {
        const { flowId, options } = await firstValueFrom(this.httpClient.post<PasskeyOptions<CreationOptionsJson>>(optionsUrl, body));
        // 'mediation' on create is WebAuthn Level 3 and not in the DOM typings yet
        const request: CredentialCreationOptions & { mediation?: CredentialMediationRequirement } = {
            mediation,
            publicKey: {
                ...options,
                challenge: toArrayBuffer(options.challenge),
                user: { ...options.user, id: toArrayBuffer(options.user.id) },
                excludeCredentials: toDescriptors(options.excludeCredentials)
            }
        };
        const credential = (await navigator.credentials.create(request)) as PublicKeyCredential;
        const response = credential.response as AuthenticatorAttestationResponse;

        return {
            flowId,
            credential: credentialJson(credential, {
                clientDataJSON: toBase64Url(response.clientDataJSON),
                attestationObject: toBase64Url(response.attestationObject),
                transports: (response.getTransports?.() ?? []).filter((transport) => KNOWN_TRANSPORTS.includes(transport))
            })
        };
    }
}
