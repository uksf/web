import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OcapEmbedService } from '../../services/ocap-embed.service';

const AAR_ORIGIN = 'https://aar.uk-sf.co.uk';
const EMBED_READY = 'ocap-embed-ready';
const EMBED_AUTH = 'ocap-embed-auth';

@Component({
    selector: 'app-operations-aar',
    templateUrl: './operations-aar.component.html',
    styleUrls: ['../operations-page/operations-page.component.scss', './operations-aar.component.scss']
})
export class OperationsAarComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private sanitizer = inject(DomSanitizer);
    private ocapEmbed = inject(OcapEmbedService);

    aarUrl: SafeResourceUrl;
    private embedToken: string | null = null;
    private iframeSource: Window | null = null;
    private readonly onMessage = (event: MessageEvent) => this.handleMessage(event);

    constructor() {
        const session = this.route.snapshot.queryParamMap.get('session');
        const params = new URLSearchParams();
        params.set('embed', '1');
        if (session) {
            params.set('session', session);
        }
        if (typeof window !== 'undefined') {
            params.set('embedReturn', window.location.href);
        }
        this.aarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${AAR_ORIGIN}/?${params.toString()}`);
    }

    ngOnInit(): void {
        window.addEventListener('message', this.onMessage);
        this.ocapEmbed.getEmbedToken().subscribe({
            next: (res) => {
                this.embedToken = res.token;
                this.pushToken();
            },
            error: () => {
                this.embedToken = null;
            }
        });
    }

    ngOnDestroy(): void {
        window.removeEventListener('message', this.onMessage);
    }

    private handleMessage(event: MessageEvent): void {
        if (event.origin !== AAR_ORIGIN) {
            return;
        }
        if (event.data?.type !== EMBED_READY) {
            return;
        }
        this.iframeSource = event.source as Window;
        this.pushToken();
    }

    private pushToken(): void {
        if (!this.embedToken || !this.iframeSource) {
            return;
        }
        this.iframeSource.postMessage({ type: EMBED_AUTH, token: this.embedToken }, AAR_ORIGIN);
    }
}
