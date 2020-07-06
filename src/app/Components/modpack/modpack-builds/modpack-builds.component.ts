import { Component, ViewChild, OnDestroy } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ModpackBuildStep } from 'app/Models/ModpackBuildStep';
import { ThemeEmitterComponent } from 'app/Components/theme-emitter/theme-emitter.component';
import { ModpackBuildService } from 'app/Services/modpackBuild.service';
import { ModpackBuildRelease } from 'app/Models/ModpackBuildRelease';
import { ModpackBuildResult } from 'app/Models/ModpackBuildResult';

@Component({
    selector: 'app-modpack-builds',
    templateUrl: './modpack-builds.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-builds.component.scss', './modpack-builds.component.scss-theme.scss']
})
export class ModpackBuildsComponent implements OnDestroy {
    @ViewChild(ThemeEmitterComponent, { static: false }) theme: ThemeEmitterComponent;
    modpackBuildResult = ModpackBuildResult;
    selectedRelease: ModpackBuildRelease = undefined;
    selectedBuild: ModpackBuild = undefined;
    selectedStep: ModpackBuildStep = undefined;
    changesMarkdown: string;
    additionalChangesMarkdown: string;
    logOpen = false;
    cancelling = false;

    constructor(
        private markdownService: MarkdownService,
        private modpackBuildService: ModpackBuildService
    ) {
        this.modpackBuildService.connect(() => {
            if (this.buildReleases.length > 0) {
                this.select(this.buildReleases[0]);
            }
        });
    }

    ngOnDestroy(): void {
        this.modpackBuildService.disconnect();
    }

    get buildReleases() {
        return this.modpackBuildService.buildReleases;
    }

    select(release: ModpackBuildRelease) {
        this.selectedRelease = release;
        if (this.selectedRelease.builds.length > 0) {
            this.selectBuild(this.selectedRelease.builds[0]);
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
            const index = this.selectedRelease.builds.indexOf(this.selectedBuild) + 1;
            if (index === this.selectedRelease.builds.length) {
                changesSincePreviousRelease = '';
            } else {
                for (let i = index; i < this.selectedRelease.builds.length - 1; i++) {
                    const previousBuild = this.selectedRelease.builds[i];
                    changesSincePreviousRelease += `#### ${this.selectedRelease.version}.${previousBuild.buildNumber}`
                    changesSincePreviousRelease += `\n${previousBuild.commit.message}<br/><br/>\n\n`
                }
            }

            this.additionalChangesMarkdown = this.markdownService.compile(changesSincePreviousRelease);
        }
    }

    previousRelease(): string {
        const index = this.buildReleases.indexOf(this.selectedRelease);
        if (index < this.buildReleases.length - 1) {
            return this.buildReleases[index + 1].version;
        }

        return 'last release';
    }

    makeReleaseCandidate() {
        this.modpackBuildService.makeRc(this.selectedRelease.version, this.selectedBuild);
    }

    cancelBuild() {
        this.cancelling = true;
        this.modpackBuildService.cancel(() => {
            this.cancelling = false;
        });
    }

    rebuild() {
        this.modpackBuildService.rebuild(this.selectedRelease.version, this.selectedBuild);
    }

    openLog() {
        this.logOpen = true;
        this.chooseStep();
        if (!this.selectedBuild.finished) {
            this.modpackBuildService.connectToBuildLog(this.selectedRelease.version, this.selectedBuild, () => {
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

    getBuildColour(build: ModpackBuild) {
        if (this.theme === undefined) {
            return '';
        }

        if (build.running) {
            return '#0c78ff';
        }

        if (build.buildResult === ModpackBuildResult.SUCCESS) {
            return 'green';
        }

        if (build.buildResult === ModpackBuildResult.FAILED) {
            return 'red';
        }

        if (build.buildResult === ModpackBuildResult.CANCELLED) {
            return 'goldenrod';
        }

        return this.theme.foregroundColor;
    }

    getLogItemColour(index: number): string {
        // TODO: Use objects for logs tht define things, styles, links maybe etc
        if (this.theme === undefined) {
            return '';
        }

        if (this.selectedStep.logs[index].includes('Error')) {
            return 'red';
        }

        if (this.selectedStep.logs[index].includes('cancelled')) {
            return 'goldenrod';
        }

        if (index > 0 && index < this.selectedStep.logs.length - 1) {
            return this.theme.foregroundColor;
        }

        if (this.selectedStep.running && index === 0) {
            return '#0c78ff';
        }

        if (this.selectedStep.buildResult === ModpackBuildResult.SUCCESS) {
            return 'green';
        }

        if (this.selectedStep.buildResult === ModpackBuildResult.FAILED) {
            return 'red';
        }

        return this.theme.foregroundColor;
    }
}
