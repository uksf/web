import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ThemeEmitterComponent } from 'app/Components/theme-emitter/theme-emitter.component';
import { ModpackBuildResult } from 'app/Models/ModpackBuildResult';
import { ModpackRc } from 'app/Models/ModpackRc';
import { ModpackRcService } from 'app/Services/modpackRc.service';
import { ModpackBuildProcessService } from 'app/Services/modpackBuildProcess.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-modpack-builds-rc',
    templateUrl: './modpack-builds-rc.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-builds-rc.component.scss', './modpack-builds-rc.component.scss-theme.scss']
})
export class ModpackBuildsRcComponent implements OnInit, OnDestroy {
    @ViewChild(ThemeEmitterComponent, { static: false }) theme: ThemeEmitterComponent;
    modpackBuildResult = ModpackBuildResult;
    selectedRcVersion = '';
    selectedBuildId = '';
    changesMarkdown: string;
    additionalChangesMarkdown: string;
    builderName = 'UKSF Bot';
    logOpen = false;
    cancelling = false;

    constructor(
        private markdownService: MarkdownService,
        private modpackBuildProcessService: ModpackBuildProcessService,
        private modpackRcService: ModpackRcService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.modpackRcService.connect(() => {
            if (this.rcs.length > 0) {
                this.checkRoute();
            } else {
                this.selectRc(undefined);
            }
        });
    }

    ngOnDestroy(): void {
        this.modpackRcService.disconnect();
    }

    get rcs() {
        return this.modpackRcService.rcs;
    }

    get selectedRc(): ModpackRc {
        return this.rcs.find(x => x.version === this.selectedRcVersion);
    }

    get selectedBuild(): ModpackBuild {
        return this.selectedRc ? this.selectedRc.builds.find(x => x.id === this.selectedBuildId) : undefined;
    }

    checkRoute() {
        const version = this.route.snapshot.queryParams['version'];
        if (version && this.rcs.findIndex(x => x.version === version) !== -1) {
            this.selectRc(version);
            const build = this.route.snapshot.queryParams['build'];
            if (build && this.selectedRc.builds.findIndex(x => x.id === build) !== -1) {
                this.selectBuild(build);
            }
        } else {
            this.selectRc(this.rcs[0].version);
        }

        const log = this.route.snapshot.queryParams['log'];
        if (log) {
            this.logOpen = true;
        }
    }

    selectRc(version: string) {
        this.selectedRcVersion = version;
        if (!this.selectedRc) {
            this.closeLog();
            this.changesMarkdown = '';
            this.additionalChangesMarkdown = '';
            this.router.navigate([], { relativeTo: this.route, queryParams: { version: null, build: null }, queryParamsHandling: 'merge' });
        } else {
            if (this.selectedRc.builds.length > 0) {
                this.selectBuild(this.selectedRc.builds[0].id);
            }
        }
    }

    selectBuild(id: string) {
        this.selectedBuildId = id;
        if (!this.selectedBuild) {
            this.closeLog();
            this.changesMarkdown = '';
            this.additionalChangesMarkdown = '';
            this.router.navigate([], { relativeTo: this.route, queryParams: { build: null }, queryParamsHandling: 'merge' });
        } else {
            this.modpackBuildProcessService.getBuilderName(this.selectedBuild.builderId, (name: string) => {
                this.builderName = name;
            }, () => {
                this.builderName = 'UKSF Bot';
            });
            this.compilePreviousChanges();
            if (this.logOpen) {
                this.openLog();
            }

            this.router.navigate([], { relativeTo: this.route, queryParams: { version: this.selectedRcVersion, build: this.selectedBuildId }, queryParamsHandling: 'merge' });
        }
    }

    compilePreviousChanges() {
        if (this.selectedBuild.commit) {
            this.changesMarkdown = this.markdownService.compile(this.selectedBuild.commit.message);

            let changesSincePreviousRelease = '';
            const index = this.selectedRc.builds.indexOf(this.selectedBuild) + 1;
            if (index === this.selectedRc.builds.length) {
                changesSincePreviousRelease = '';
            } else {
                for (let i = index; i < this.selectedRc.builds.length; i++) {
                    const previousBuild = this.selectedRc.builds[i];
                    changesSincePreviousRelease += `#### RC #${previousBuild.buildNumber}`;
                    changesSincePreviousRelease += `\n${previousBuild.commit.message}<br/><br/>\n\n`;
                }
            }

            this.additionalChangesMarkdown = this.markdownService.compile(changesSincePreviousRelease);
        }
    }

    previousRelease(): string {
        const index = this.rcs.indexOf(this.selectedRc);
        if (index < this.rcs.length - 1) {
            return this.rcs[index + 1].version;
        }

        return 'last release';
    }

    openLog() {
        this.logOpen = true;
        this.router.navigate([], { relativeTo: this.route, queryParams: { log: true }, queryParamsHandling: 'merge' });
    }

    closeLog() {
        this.logOpen = false;
        this.router.navigate([], { relativeTo: this.route, queryParams: { log: null, step: null, line: null }, queryParamsHandling: 'merge' });
    }

    cancelBuild() {
        this.cancelling = true;
        this.modpackBuildProcessService.cancel(this.selectedBuild, () => {
            this.cancelling = false;
        });
    }

    rebuild() {
        this.modpackBuildProcessService.rebuild(this.selectedBuild);
    }

    get duration() {
        return this.modpackBuildProcessService.duration(this.selectedBuild.startTime, this.selectedBuild.endTime);
    }

    get branch() {
        return this.modpackBuildProcessService.branch(this.selectedBuild.commit.branch);
    }

    anySkipped(build: ModpackBuild): boolean {
        return build.steps.findIndex(x => x.buildResult === ModpackBuildResult.SKIPPED) !== -1;
    }

    getBuildColour(build: ModpackBuild) {
        if (this.theme === undefined) {
            return { 'color': '' };
        }

        if (build.running) {
            return { 'color': '#0c78ff' };
        }

        if (build.buildResult === ModpackBuildResult.FAILED) {
            return { 'color': 'red' };
        }

        if (build.buildResult === ModpackBuildResult.CANCELLED) {
            return { 'color': 'goldenrod' };
        }

        if (this.anySkipped(build)) {
            return { 'color': 'orange' };
        }

        if (build.buildResult === ModpackBuildResult.SUCCESS) {
            return { 'color': 'green' };
        }

        if (build === this.selectedBuild) {
            return { 'color': this.theme.primaryColor };
        }

        return { 'color': this.theme.foregroundColor };
    }
}
