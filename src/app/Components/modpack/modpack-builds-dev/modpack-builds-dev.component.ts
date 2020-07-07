import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ModpackBuildStep } from 'app/Models/ModpackBuildStep';
import { ThemeEmitterComponent } from 'app/Components/theme-emitter/theme-emitter.component';
import { ModpackBuildService } from 'app/Services/modpackBuild.service';
import { ModpackBuildResult } from 'app/Models/ModpackBuildResult';
import { MarkdownService } from 'ngx-markdown';
import * as moment from 'moment';
import { DisplayNameService } from 'app/Services/displayName.service';
import { ModpackBuildProcessService } from 'app/Services/modpackBuildProcess.service';

@Component({
    selector: 'app-modpack-builds-dev',
    templateUrl: './modpack-builds-dev.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-builds-dev.component.scss', './modpack-builds-dev.component.scss-theme.scss']
})
export class ModpackBuildsDevComponent implements OnInit, OnDestroy {
    @ViewChild(ThemeEmitterComponent, { static: false }) theme: ThemeEmitterComponent;
    modpackBuildResult = ModpackBuildResult;
    selectedBuildNumber = 0;
    selectedStepIndex = 0;
    changesMarkdown: string;
    builderName = 'UKSF Bot';
    logOpen = false;
    cancelling = false;

    constructor(
        private modpackBuildService: ModpackBuildService,
        private modpackBuildProcessService: ModpackBuildProcessService,
        private markdownService: MarkdownService
    ) { }

    ngOnInit(): void {
        this.modpackBuildService.connect(() => {
            this.selectBuild(this.builds.length - 1);
        });
    }

    ngOnDestroy(): void {
        this.modpackBuildService.disconnect();
    }

    get builds() {
        return this.modpackBuildService.builds;
    }

    get selectedBuild(): ModpackBuild {
        return this.builds.length > this.selectedBuildNumber ? this.builds.find(x => x.buildNumber === this.selectedBuildNumber) : undefined;
    }

    get selectedStep(): ModpackBuildStep {
        return this.selectedBuild && this.selectedBuild.steps.length > this.selectedStepIndex ? this.selectedBuild.steps[this.selectedStepIndex] : undefined;
    }

    selectBuild(buildNumber: number) {
        this.selectedBuildNumber = buildNumber;
        if (!this.selectedBuild) {
            this.closeLog();
            this.selectedStepIndex = 0;
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

    selectStep(index: number) {
        this.selectedStepIndex = index;
    }

    chooseStep() {
        if (this.selectedBuild.running) {
            const index = this.selectedBuild.steps.findIndex(x => x.running);
            if (index !== -1) {
                this.selectStep(index);
            }
        } else if (this.selectedBuild.finished) {
            if (this.selectedBuild.buildResult === ModpackBuildResult.FAILED) {
                this.selectStep(this.selectedBuild.steps.findIndex(x => x.buildResult === ModpackBuildResult.FAILED));
            } else if (this.selectedBuild.buildResult === ModpackBuildResult.CANCELLED) {
                this.selectStep(this.selectedBuild.steps.findIndex(x => x.buildResult === ModpackBuildResult.CANCELLED));
            } else {
                this.selectStep(this.selectedBuild.steps.length - 1);
            }
        } else {
            this.selectStep(0);
        }
    }

    openLog() {
        this.logOpen = true;
        this.chooseStep();
        if (!this.selectedBuild.finished) {
            this.modpackBuildService.connectToBuildLog(this.selectedBuild, () => {
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
        this.modpackBuildService.disconnectFromBuildLog();
    }

    newBuild() {

    }

    cancelBuild() {
        this.cancelling = true;
        this.modpackBuildService.cancel(this.selectedBuild, () => {
            this.cancelling = false;
        });
    }

    rebuild() {
        this.modpackBuildService.rebuild(this.selectedBuild);
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
