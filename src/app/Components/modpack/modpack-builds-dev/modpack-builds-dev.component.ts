import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ThemeEmitterComponent } from 'app/Components/elements/theme-emitter/theme-emitter.component';
import { ModpackBuildService } from 'app/Services/modpackBuild.service';
import { ModpackBuildResult } from 'app/Models/ModpackBuildResult';
import { MarkdownService } from 'ngx-markdown';
import { ModpackBuildProcessService } from 'app/Services/modpackBuildProcess.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionsService } from '../../../Services/permissions.service';

@Component({
    selector: 'app-modpack-builds-dev',
    templateUrl: './modpack-builds-dev.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-builds-dev.component.scss', './modpack-builds-dev.component.scss-theme.scss'],
})
export class ModpackBuildsDevComponent implements OnInit, OnDestroy {
    @ViewChild(ThemeEmitterComponent) theme: ThemeEmitterComponent;
    modpackBuildResult = ModpackBuildResult;
    selectedBuildId = '';
    changesMarkdown: string;
    builderName = 'UKSF Bot';
    logOpen = false;
    cancelling = false;
    selectIncomingBuild = false;

    constructor(
        private modpackBuildService: ModpackBuildService,
        private modpackBuildProcessService: ModpackBuildProcessService,
        private markdownService: MarkdownService,
        private route: ActivatedRoute,
        private router: Router,
        private permissions: PermissionsService
    ) {}

    ngOnInit(): void {
        this.modpackBuildService.connect(
            () => {
                if (this.builds.length > 0) {
                    this.checkRoute();
                } else {
                    this.selectBuild('');
                }
            },
            (id: string) => {
                if (this.selectIncomingBuild) {
                    this.cancelling = false;
                    this.selectIncomingBuild = false;
                    this.selectBuild(id);
                }
            }
        );

        if (this.permissions.hasPermission('TESTER')) {
            this.modpackBuildProcessService.getBranches();
        }
    }

    ngOnDestroy(): void {
        this.modpackBuildService.disconnect();
    }

    get branches() {
        return this.modpackBuildProcessService.branches;
    }

    get builds() {
        return this.modpackBuildService.builds;
    }

    get selectedBuild(): ModpackBuild {
        return this.builds.find((x) => x.id === this.selectedBuildId);
    }

    checkRoute() {
        const build = this.route.snapshot.queryParams['build'];
        if (build && this.builds.findIndex((x) => x.id === build) !== -1) {
            this.selectBuild(build);
        } else {
            this.selectBuild(this.builds[0].id);
        }

        const log = this.route.snapshot.queryParams['log'];
        if (log) {
            this.logOpen = true;
        }
    }

    selectBuild(id: string) {
        this.selectedBuildId = id;
        if (!this.selectedBuild) {
            this.changesMarkdown = '';
            this.closeLog();
        } else {
            this.modpackBuildProcessService.getBuilderName(
                this.selectedBuild.builderId,
                (name: string) => {
                    this.builderName = name;
                },
                () => {
                    this.builderName = 'UKSF Bot';
                }
            );
            this.changesMarkdown = this.markdownService.compile(this.selectedBuild.commit.message);
            if (this.logOpen) {
                this.openLog();
            }

            this.router.navigate([], { relativeTo: this.route, queryParams: { build: this.selectedBuildId }, queryParamsHandling: 'merge' });
        }
    }

    openLog() {
        this.logOpen = true;
        this.router.navigate([], { relativeTo: this.route, queryParams: { log: true }, queryParamsHandling: 'merge' });
    }

    closeLog() {
        this.logOpen = false;
        this.router.navigate([], { relativeTo: this.route, queryParams: { log: null, step: null, line: null }, queryParamsHandling: 'merge' });
    }

    newBuild() {
        this.modpackBuildProcessService.newBuild(() => {
            this.selectIncomingBuild = true;
        });
    }

    cancelBuild() {
        this.cancelling = true;
        this.modpackBuildProcessService.cancel(this.selectedBuild, () => {
            this.cancelling = false;
        });
    }

    canRebuild = (): boolean => {
        return this.selectedBuild.finished;
    };

    rebuild() {
        this.modpackBuildProcessService.rebuild(this.selectedBuild, () => {
            this.selectIncomingBuild = true;
        });
    }

    get duration() {
        return this.modpackBuildProcessService.duration(this.selectedBuild.startTime, this.selectedBuild.endTime);
    }

    get branch() {
        return this.modpackBuildProcessService.branch(this.selectedBuild.commit.branch);
    }

    get commit() {
        return this.selectedBuild.commit.after.substr(0, 7);
    }

    anyWarning(build: ModpackBuild): boolean {
        return build.steps.findIndex((x) => x.buildResult === ModpackBuildResult.WARNING) !== -1;
    }

    getBuildColour(build: ModpackBuild) {
        if (this.theme === undefined) {
            return { color: '' };
        }

        if (!build.running && !build.finished) {
            return { color: 'gray' };
        }

        if (build.running) {
            return { color: '#0c78ff' };
        }

        if (build.buildResult === ModpackBuildResult.FAILED) {
            return { color: 'red' };
        }

        if (build.buildResult === ModpackBuildResult.CANCELLED) {
            return { color: 'goldenrod' };
        }

        if (build.buildResult === ModpackBuildResult.WARNING || this.anyWarning(build)) {
            return { color: 'orangered' };
        }

        if (build.buildResult === ModpackBuildResult.SUCCESS) {
            return { color: 'green' };
        }

        if (build === this.selectedBuild) {
            return { color: this.theme.primaryColor };
        }

        return { color: this.theme.foregroundColor };
    }
}
