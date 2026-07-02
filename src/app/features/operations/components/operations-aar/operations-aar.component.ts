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
        const url = session ? `https://aar.uk-sf.co.uk/?session=${session}` : 'https://aar.uk-sf.co.uk';
        this.aarUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
