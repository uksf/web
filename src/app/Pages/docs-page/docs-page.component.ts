import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';

@Component({
    selector: 'app-docs-page',
    templateUrl: './docs-page.component.html',
    styleUrls: ['./docs-page.component.css'],
})
export class DocsPageComponent implements OnInit, OnDestroy {
    toc;
    doc;
    private sub;

    constructor(private route: ActivatedRoute, private router: Router, private httpClient: HttpClient, private urlService: UrlService) {
        this.httpClient.get(this.urlService.apiUrl + '/Docs').subscribe((data) => {
            this.toc = data;
            this.router.navigate(['/docs/' + this.toc[0].name]);
        });

        if (this.route.snapshot.params.id) {
            this.httpClient.get(this.urlService.apiUrl + '/Docs/' + this.route.snapshot.params.id).subscribe((data: any) => {
                this.doc = data.doc;
            });
        } else {
            this.doc = 'select a document';
        }
        this.sub = router.events.subscribe((val) => {
            // see also
            if (val instanceof NavigationEnd) {
                this.httpClient.get(this.urlService.apiUrl + '/Docs/' + this.route.snapshot.params.id).subscribe((data: any) => {
                    this.doc = data.doc;
                });
            }
        });
    }

    ngOnInit() {}

    ngOnDestroy() {
        this.sub.unsubscribe();
    }
}
