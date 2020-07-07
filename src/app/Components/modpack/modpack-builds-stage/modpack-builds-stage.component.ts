import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ModpackBuildStep } from 'app/Models/ModpackBuildStep';
import { ThemeEmitterComponent } from 'app/Components/theme-emitter/theme-emitter.component';
import { ModpackBuildService } from 'app/Services/modpackBuild.service';
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
    selectedRc: ModpackRc = undefined;
    selectedBuild: ModpackBuild = undefined;
    selectedStep: ModpackBuildStep = undefined;
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
                this.selectRc(this.rcs[0]);
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

    selectRc(rc: ModpackRc) {
        if (rc === undefined) {
            this.closeLog();
            this.selectedRc = undefined;
            this.changesMarkdown = undefined;
            this.additionalChangesMarkdown = undefined;
            this.selectedStep = undefined;
        } else {
            this.selectedRc = rc;
            if (this.selectedRc.builds.length > 0) {
                this.selectBuild(this.selectedRc.builds[0]);
            }
        }
    }

    selectBuild(build: ModpackBuild) {
        if (build === undefined) {
            this.closeLog();
            this.selectedBuild = undefined;
            this.changesMarkdown = undefined;
            this.additionalChangesMarkdown = undefined;
            this.selectedStep = undefined;
        } else {
            this.selectedBuild = build;
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

    chooseStep() {
        if (this.selectedBuild.running) {
            const step = this.selectedBuild.steps.find(x => x.running);
            if (step) {
                this.selectStep(step);
            }
        } else if (this.selectedBuild.finished) {
            if (this.selectedBuild.buildResult === ModpackBuildResult.FAILED) {
                this.selectStep(this.selectedBuild.steps.find(x => x.buildResult === ModpackBuildResult.FAILED));
            } else if (this.selectedBuild.buildResult === ModpackBuildResult.CANCELLED) {
                this.selectStep(this.selectedBuild.steps.find(x => x.buildResult === ModpackBuildResult.CANCELLED));
            } else {
                this.selectStep(this.selectedBuild.steps[this.selectedBuild.steps.length - 1]);
            }
        } else {
            this.selectStep(this.selectedBuild.steps[0]);
        }
    }

    selectStep(step: ModpackBuildStep) {
        if (step === undefined) {
            this.selectedStep = undefined;
        } else {
            this.selectedStep = step;
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

    cancelBuild() {
        this.cancelling = true;
        this.modpackRcService.cancel(this.selectedBuild, () => {
            this.cancelling = false;
        });
    }

    rebuild() {
        this.modpackRcService.rebuild(this.selectedBuild);
    }

    openLog() {
        this.logOpen = true;
        this.chooseStep();
        if (!this.selectedBuild.finished) {
            this.modpackRcService.connectToBuildLog(this.selectedBuild, () => {
                this.chooseStep();
            });
        }
    }

    closeLog() {
        if (!this.logOpen) {
            return;
        }

        this.logOpen = false;
        this.selectStep(undefined);
        this.modpackRcService.disconnectFromBuildLog();
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

    getLogItemColour(index: number): any {
        // TODO: Use objects for logs tht define things, styles, links maybe etc
        if (this.theme === undefined) {
            return { 'color': '' };
        }

        if (this.selectedStep.logs[index].includes('Error')) {
            return { 'color': 'red' };
        }

        if (this.selectedStep.logs[index].includes('cancelled')) {
            return { 'color': 'goldenrod' };
        }

        if (index > 0 && index < this.selectedStep.logs.length - 1) {
            return { 'color': this.theme.foregroundColor };
        }

        if (this.selectedStep.running && index === 0) {
            return { 'color': '#0c78ff' };
        }

        if (this.selectedStep.buildResult === ModpackBuildResult.SUCCESS) {
            return { 'color': 'green' };
        }

        if (this.selectedStep.buildResult === ModpackBuildResult.FAILED) {
            return { 'color': 'red' };
        }

        return { 'color': this.theme.foregroundColor };
    }
}
