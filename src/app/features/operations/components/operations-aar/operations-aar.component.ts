import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-operations-aar',
    templateUrl: './operations-aar.component.html',
    styleUrls: ['../operations-page/operations-page.component.scss', './operations-aar.component.scss']
})
export class OperationsAarComponent {
    private route = inject(ActivatedRoute);
    private sanitizer = inject(DomSanitizer);

    aarUrl: SafeResourceUrl;

    constructor() {
        const session = this.route.snapshot.queryParamMap.get('session');
        // Pass parent URL so OCAP Steam login can return here after top-level OpenID
        // (Steam blocks framing; OCAP breaks out then bounces back via embedReturn).
        const params = new URLSearchParams();
        if (session) {
            params.set('session', session);
        }
        if (typeof window !== 'undefined') {
            params.set('embedReturn', window.location.href);
        }
        const qs = params.toString();
        const url = qs ? `https://aar.uk-sf.co.uk/?${qs}` : 'https://aar.uk-sf.co.uk';
        this.aarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
