import { Component, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { ModpackRelease } from 'app/Models/ModpackRelease';
import { HttpClient } from '@angular/common/http';
import { UrlService } from 'app/Services/url.service';
import { PermissionsService } from 'app/Services/permissions.service';
import { Permissions } from 'app/Services/permissions';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-modpack-releases',
    templateUrl: './modpack-releases.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-releases.component.scss', './modpack-releases.component.scss-theme.scss']
})
export class ModpackReleasesComponent implements OnInit {
    releases: ModpackRelease[] = [];
    selectedRelease: ModpackRelease = undefined;
    editing = false;
    preview = false;
    descriptionEditing: string;
    changelogEditing: string;
    changelogStaging: string;
    changelogMarkdown: string;

    constructor(
        private markdownService: MarkdownService,
        private httpClient: HttpClient,
        private urls: UrlService,
        private permissionsService: PermissionsService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.getReleases();
    }

    get publicReleases(): ModpackRelease[] {
        return this.releases.filter(x => !x.isDraft || this.permissionsService.hasPermission(Permissions.TESTER));
    }

    checkRoute() {
        const version = this.route.snapshot.queryParams['version'];
        const index = this.releases.findIndex(x => x.version === version);
        if (version && index !== -1) {
            this.select(this.releases[index]);
        } else {
            this.select(this.releases[0]);
        }
    }

    getReleases() {
        this.httpClient.get(this.urls.apiUrl + '/modpack/releases').subscribe((releases: ModpackRelease[]) => {
            this.releases = releases;
            this.checkRoute();
        }, error => this.urls.errorWrapper('Failed to get releases', error));
    }

    select(release: ModpackRelease) {
        this.editing = false;
        this.selectedRelease = release;
        this.changelogMarkdown = this.markdownService.compile(this.selectedRelease.changelog);
        this.router.navigate([], { relativeTo: this.route, queryParams: { version: this.selectedRelease.version }, queryParamsHandling: 'merge' });
    }

    edit() {
        this.editing = true;
        this.descriptionEditing = this.selectedRelease.description;
        this.changelogStaging = this.selectedRelease.changelog;
        this.formatChangelog(this.editing);
    }

    togglePreview() {
        this.preview = !this.preview;
        if (this.preview) {
            this.formatChangelog(false);
            this.changelogMarkdown = this.markdownService.compile(this.changelogStaging);
        }
    }

    save() {
        this.editing = false;
        this.preview = false;
        this.selectedRelease.description = this.descriptionEditing;
        this.formatChangelog(this.editing);
        this.selectedRelease.changelog = this.changelogStaging;
        this.changelogMarkdown = this.markdownService.compile(this.selectedRelease.changelog);
        // patch changes
        this.httpClient.patch(this.urls.apiUrl + `/modpack/release/${this.selectedRelease.version}`, this.selectedRelease).subscribe(
            () => { },
            error => this.urls.errorWrapper('Failed to update release draft', error)
        );
    }

    discard() {
        this.editing = false;
        this.preview = false;
        this.descriptionEditing = '';
        this.changelogEditing = '';
        this.changelogStaging = '';
        this.changelogMarkdown = this.markdownService.compile(this.selectedRelease.changelog);
    }

    release() {
        // get request for release
        this.httpClient.get(this.urls.apiUrl + `/modpack/release/${this.selectedRelease.version}`).subscribe(response => {
            this.getReleases();
        }, error => this.urls.errorWrapper('Failed to deploy release', error));
    }

    validateDescription(event: any) {
        const text = (event.target as HTMLTextAreaElement).value;
        const parts = text.split('\n');
        if (parts.length > 3) {
            const newText = parts.reduce((result, line, lineNumber) => {
                if (lineNumber < 3) {
                    return result.concat('\n').concat(line);
                }
                return result.concat(line);
            });
            (event.target as HTMLTextAreaElement).value = newText;
        }
    }

    formatChangelog(editing: boolean) {
        if (editing) {
            this.changelogEditing = this.changelogStaging.replace(/<br>/g, '');
        } else {
            const lines = this.changelogEditing.split('\n');
            for (let index = 0; index < lines.length; index++) {
                const line = lines[index];
                if (line.startsWith('  ') && !line.match(/( {2,})-/)) {
                    lines[index] = `<br>${line}`;
                }
            }
            this.changelogStaging = lines.join('\n');
        }
    }
}
