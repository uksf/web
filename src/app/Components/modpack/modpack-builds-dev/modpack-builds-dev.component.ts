import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ThemeEmitterComponent } from 'app/Components/theme-emitter/theme-emitter.component';
import { ModpackBuildService } from 'app/Services/modpackBuild.service';
import { ModpackBuildResult } from 'app/Models/ModpackBuildResult';
import { MarkdownService } from 'ngx-markdown';
import { ModpackBuildProcessService } from 'app/Services/modpackBuildProcess.service';
import { ModpackBuildsStepsComponent } from '../modpack-builds-steps/modpack-builds-steps.component';

@Component({
    selector: 'app-modpack-builds-dev',
    templateUrl: './modpack-builds-dev.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-builds-dev.component.scss', './modpack-builds-dev.component.scss-theme.scss']
})
export class ModpackBuildsDevComponent implements OnInit, OnDestroy {
    @ViewChild(ThemeEmitterComponent, { static: false }) theme: ThemeEmitterComponent;
    modpackBuildResult = ModpackBuildResult;
    selectedBuildId = '';
    changesMarkdown: string;
    builderName = 'UKSF Bot';
    logOpen = false;
    cancelling = false;

    constructor(
        private modpackBuildService: ModpackBuildService,
        private modpackBuildProcessService: ModpackBuildProcessService,
        private markdownService: MarkdownService,
    ) { }

    ngOnInit(): void {
        this.modpackBuildService.connect(() => {
            if (this.builds.length > 0) {
                this.selectBuild(this.builds[0].id);
            } else {
                this.selectBuild('');
            }
        });
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
        return this.builds.find(x => x.id === this.selectedBuildId);
    }

    selectBuild(id: string) {
        this.selectedBuildId = id;
        if (!this.selectedBuild) {
            this.changesMarkdown = '';
            this.closeLog();
        } else {
            this.modpackBuildProcessService.getBuilderName(this.selectedBuild.builderId, (name: string) => {
                this.builderName = name;
            }, () => {
                this.builderName = 'UKSF Bot';
            });
            this.changesMarkdown = this.markdownService.compile(this.selectedBuild.commit.message);
            if (this.logOpen) {
                this.openLog();
            }
        }
    }

    openLog() {
        this.logOpen = true;
    }

    closeLog() {
        this.logOpen = false;
    }

    newBuild() {
        this.modpackBuildProcessService.newBuild();
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

    getBuildColour(build: ModpackBuild) {
        if (this.theme === undefined) {
            return { 'color': '' };
        }

        if (build.running) {
            return { 'color': '#0c78ff' };
        }

        if (build.buildResult === ModpackBuildResult.SUCCESS) {
            return { 'color': 'green' };
        }

        if (build.buildResult === ModpackBuildResult.FAILED) {
            return { 'color': 'red' };
        }

        if (build.buildResult === ModpackBuildResult.CANCELLED) {
            return { 'color': 'goldenrod' };
        }

        if (build === this.selectedBuild) {
            return { 'color': this.theme.primaryColor };
        }

        return { 'color': this.theme.foregroundColor };
    }
}
