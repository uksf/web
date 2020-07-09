import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ThemeEmitterComponent } from 'app/Components/theme-emitter/theme-emitter.component';
import { ModpackBuildResult } from 'app/Models/ModpackBuildResult';
import { ModpackRc } from 'app/Models/ModpackRc';
import { ModpackRcService } from 'app/Services/modpackRc.service';
import { ModpackBuildProcessService } from 'app/Services/modpackBuildProcess.service';

@Component({
    selector: 'app-modpack-builds-stage',
    templateUrl: './modpack-builds-stage.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-builds-stage.component.scss', './modpack-builds-stage.component.scss-theme.scss']
})
export class ModpackBuildsStageComponent implements OnInit, OnDestroy {
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
        private modpackRcService: ModpackRcService
    ) { }

    ngOnInit(): void {
        this.modpackRcService.connect(() => {
            if (this.rcs.length > 0) {
                this.selectRc(this.rcs[0].version);
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

    selectRc(version: string) {
        this.selectedRcVersion = version;
        if (!this.selectedRc) {
            this.closeLog();
            this.changesMarkdown = '';
            this.additionalChangesMarkdown = '';
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
    }

    closeLog() {
        this.logOpen = false;
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
