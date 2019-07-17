import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../Services/api.service';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

@Component({
    selector: 'app-docs-page',
    templateUrl: './docs-page.component.html',
    styleUrls: ['./docs-page.component.css']
})
export class DocsPageComponent implements OnInit, OnDestroy {
    toc;
    doc;
    private sub;

    constructor(
        Api: ApiService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        Api.sendRequest(
            () => { return Api.httpClient.get(Api.urls.apiUrl + '/Docs') },
            (data) => {
            this.toc = data;
                this.router.navigate(['/docs/' + this.toc[0].name]);
            },
            'failed to get docs'
        );

        if (this.route.snapshot.params.id) {
            Api.sendRequest(
                () => { return Api.httpClient.get(Api.urls.apiUrl + '/Docs/' + this.route.snapshot.params.id) },
                (data) => { this.doc = data.doc },
                'failed to get the doc'
            );
        } else {
            this.doc = 'select a document';
        }
        this.sub = router.events.subscribe((val) => {
            // see also
            if (val instanceof NavigationEnd) {
                Api.sendRequest(
                    () => { return Api.httpClient.get(Api.urls.apiUrl + '/Docs/' + this.route.snapshot.params.id) },
                    (data) => { this.doc = data.doc },
                    'failed to get the doc'
                );
            }
        });
    }

    ngOnInit() { }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }
}
