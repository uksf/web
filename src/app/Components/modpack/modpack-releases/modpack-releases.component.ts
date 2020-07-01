import { Component, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { ModpackRelease } from 'app/Models/ModpackRelease';
import { HttpClient } from '@angular/common/http';
import { UrlService } from 'app/Services/url.service';

@Component({
    selector: 'app-modpack-releases',
    templateUrl: './modpack-releases.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-releases.component.scss', './modpack-releases.component.scss-theme.scss']
})
export class ModpackReleasesComponent implements OnInit {
    releases: ModpackRelease[] = [];
    selectedRelease: ModpackRelease = undefined;
    changelogMarkdown: string;

    constructor(
        private markdownService: MarkdownService,
        private httpClient: HttpClient,
        private urls: UrlService
    ) { }

    ngOnInit() {
        this.httpClient.get(this.urls.apiUrl + '/modpack/releases').subscribe((releases: ModpackRelease[]) => {
            this.releases = releases;
            this.select(this.releases[0]);
        }, error => this.urls.errorWrapper('Failed to get releases', error));
    }

    select(release: ModpackRelease) {
        this.selectedRelease = release;
        this.changelogMarkdown = this.markdownService.compile(release.changelog);
    }
}
