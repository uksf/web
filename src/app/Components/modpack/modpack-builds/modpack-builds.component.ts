import { Component, ViewChild } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ModpackBuildStep } from 'app/Models/ModpackBuildStep';
import { ThemeEmitterComponent } from 'app/Components/theme-emitter/theme-emitter.component';
import { ModpackBuildService } from 'app/Services/modpackBuild.service';
import { ModpackBuildRelease } from 'app/Models/ModpackBuildRelease';

@Component({
    selector: 'app-modpack-builds',
    templateUrl: './modpack-builds.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-builds.component.scss', './modpack-builds.component.scss-theme.scss']
})
export class ModpackBuildsComponent {
    @ViewChild(ThemeEmitterComponent, { static: false }) theme: ThemeEmitterComponent;
    selectedRelease: ModpackBuildRelease = undefined;
    selectedBuild: ModpackBuild = undefined;
    changesMarkdown: string;
    additionalChangesMarkdown: string;
    logOpen = false;
    selectedStep: ModpackBuildStep = undefined;

    constructor(
        private markdownService: MarkdownService,
        private modpackBuildService: ModpackBuildService
    ) {
        this.modpackBuildService.connect(() => {
            this.select(this.buildsReleases[0]);
        });
    }

    get buildsReleases() {
        return this.modpackBuildService.buildsReleases;
    }

    select(release: ModpackBuildRelease) {
        this.selectedRelease = release;
        if (this.selectedRelease.builds.length > 0) {
            this.selectBuild(this.selectedRelease.builds[0]);
        } else {
            // This should never happen as a build release can't be made without a build to make it from
            console.log('build release select error');
            this.selectBuild(undefined);
        }
    }

    selectBuild(build: ModpackBuild) {
        if (build === undefined) {
            this.selectedBuild = undefined;
            this.changesMarkdown = undefined;
            this.additionalChangesMarkdown = undefined;
        } else {
            this.selectedBuild = build;
            this.changesMarkdown = this.markdownService.compile(build.changes);

            let changesSincePreviousRelease = '';
            const index = this.selectedRelease.builds.indexOf(this.selectedBuild) + 1;
            if (index === this.selectedRelease.builds.length) {
                changesSincePreviousRelease = '';
            } else {
                for (let i = index; i < this.selectedRelease.builds.length - 1; i++) {
                    const previousBuild = this.selectedRelease.builds[i];
                    changesSincePreviousRelease += `#### ${this.selectedRelease.version}.${previousBuild.buildNumber}`
                    changesSincePreviousRelease += `\n${previousBuild.changes}<br/><br/>\n\n`
                }
            }

            this.additionalChangesMarkdown = this.markdownService.compile(changesSincePreviousRelease);
        }

        this.closeLog();
    }

    selectStep(step: ModpackBuildStep) {
        if (step === undefined) {
            this.selectedStep = undefined;
        } else {
            this.selectedStep = step;
        }
    }

    previousRelease(): string {
        const index = this.buildsReleases.indexOf(this.selectedRelease);
        if (index < this.buildsReleases.length - 1) {
            return this.buildsReleases[index + 1].version;
        }

        return 'last release';
    }

    makeRelease() {

    }

    makeReleaseCandidate() {

    }

    openLog() {
        this.logOpen = true;
        this.selectStep(this.selectedBuild.steps[0]);
        this.modpackBuildService.connectToBuildLog(this.selectedRelease.version, this.selectedBuild);
    }

    closeLog() {
        if (!this.logOpen) {
            return;
        }

        this.logOpen = false;
        this.selectStep(undefined);
        this.modpackBuildService.disconnectFromBuildLog();
    }

    getLogItemColour(index: number): string {
        if (this.theme === undefined) {
            return '';
        }

        if (index > 0 && index < this.selectedStep.logs.length - 1) {
            return this.theme.foregroundColor;
        }

        if (this.selectedStep.running && index === 0) {
            return '#0c78ff';
        }

        if (this.selectedStep.success) {
            return 'green';
        }

        if (this.selectedStep.fail) {
            return 'red';
        }

        return this.theme.foregroundColor;
    }
}
