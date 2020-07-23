import { Component, ViewChild, OnDestroy, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ModpackBuildStep } from 'app/Models/ModpackBuildStep';
import { ThemeEmitterComponent } from 'app/Components/theme-emitter/theme-emitter.component';
import { ModpackBuildResult } from 'app/Models/ModpackBuildResult';
import { ModpackBuildProcessService } from 'app/Services/modpackBuildProcess.service';
import { ConnectionContainer, SignalRService } from 'app/Services/signalr.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { nextFrame } from 'app/Services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-modpack-builds-steps',
    templateUrl: './modpack-builds-steps.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-builds-steps.component.scss', './modpack-builds-steps.component.scss-theme.scss']
})
export class ModpackBuildsStepsComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChild(ThemeEmitterComponent, { static: false }) theme: ThemeEmitterComponent;
    @ViewChild(CdkVirtualScrollViewport, { static: false }) scrollView: CdkVirtualScrollViewport;
    @Input() build: ModpackBuild;
    @Output() onCloseLog = new EventEmitter();
    private hubConnection: ConnectionContainer;
    modpackBuildResult = ModpackBuildResult;
    selectedStepIndex = 0;
    selectedLogIndex = -1;
    overrideAutomaticStepChoose = false;
    ignoreUpdates = false;
    cancelling = false;
    autoScroll = true;

    constructor(
        private signalrService: SignalRService,
        private modpackBuildProcessService: ModpackBuildProcessService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.connect();
    }

    ngOnDestroy(): void {
        this.disconnect();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!changes.build.isFirstChange() && changes.build.previousValue.buildNumber !== changes.build.currentValue.buildNumber) {
            this.reconnect();
        }
    }

    connect() {
        this.modpackBuildProcessService.getBuildLogData(this.build.id, (newBuild: ModpackBuild) => {
            this.build = newBuild;
            this.checkRoute();
            this.chooseStep();

            if (!this.build.finished) {
                this.hubConnection = this.signalrService.connect(`builds?buildId=${this.build.id}`);
                this.hubConnection.connection.on('ReceiveBuildStep', (step: ModpackBuildStep) => {
                    this.build.steps.splice(step.index, 1, step);
                    this.chooseStep();
                });
                this.hubConnection.reconnectEvent.subscribe(() => {
                    this.modpackBuildProcessService.getBuildLogData(this.build.id, (reconnectBuild: ModpackBuild) => {
                        this.build = reconnectBuild;
                        this.chooseStep();
                    });
                });
            }
        });
    }

    disconnect() {
        if (this.hubConnection !== undefined) {
            this.hubConnection.connection.stop();
        }
    }

    reconnect() {
        this.router.navigate([], { relativeTo: this.route, queryParams: { step: null, line: null }, queryParamsHandling: 'merge' });
        this.ignoreUpdates = false;
        this.overrideAutomaticStepChoose = false;
        this.disconnect();
        this.connect();
    }

    get selectedStep(): ModpackBuildStep {
        return this.build && this.build.steps.length > this.selectedStepIndex ? this.build.steps[this.selectedStepIndex] : undefined;
    }

    stepTrackBy(index: number, step: ModpackBuildStep) {
        return `${index}-${step.name}-${step.running}-${step.finished}-${step.buildResult}-${step.startTime}-${step.endTime}`;
    }

    checkRoute() {
        const step = this.route.snapshot.queryParams['step'];
        if (step) {
            const line = this.route.snapshot.queryParams['line'];
            if (line) {
                this.selectStep(step - 1, true);
                this.setScroll(line - 5);
                this.selectLogLine(line - 1);
            }
        }
    }

    chooseStep() {
        if (this.ignoreUpdates || this.overrideAutomaticStepChoose) {
            return;
        }

        if (this.build.running) {
            const index = this.build.steps.findIndex(x => x.running);
            if (index !== -1) {
                this.selectStep(index);
            }
        } else if (this.build.finished) {
            if (this.build.buildResult === ModpackBuildResult.FAILED) {
                this.selectStep(this.build.steps.findIndex(x => x.buildResult === ModpackBuildResult.FAILED));
            } else if (this.build.buildResult === ModpackBuildResult.CANCELLED) {
                this.selectStep(this.build.steps.findIndex(x => x.buildResult === ModpackBuildResult.CANCELLED));
            } else if (this.anySkipped) {
                this.selectStep(this.build.steps.findIndex(x => x.buildResult === ModpackBuildResult.SKIPPED));
            } else {
                this.selectStep(this.build.steps.length - 1);
            }
        } else {
            this.selectStep(0);
        }
    }

    selectStep(index: number, override: boolean = false) {
        if (this.selectedStepIndex !== index) {
            this.selectLogLine(-1);
        }

        this.selectedStepIndex = index;
        const runningIndex = this.build.steps.findIndex(x => x.running);
        this.overrideAutomaticStepChoose = this.selectedStepIndex === runningIndex ? false : override;
        this.setScroll();
    }

    setScroll(index: number = -1) {
        if (index > -1) {
            nextFrame(() => {
                this.scrollView.scrollToIndex(index, 'smooth');
            });
        } else if (this.autoScroll && this.selectedStep.running) {
            nextFrame(() => {
                this.scrollView.scrollTo({ bottom: 0 });
            });
        }
    }

    selectLogLine(index: number) {
        if (index === -1 || this.selectedLogIndex === index) {
            this.selectedLogIndex = -1;
            this.ignoreUpdates = false;
            this.router.navigate([], { relativeTo: this.route, queryParams: { step: null, line: null }, queryParamsHandling: 'merge' });
        } else {
            this.selectedLogIndex = index;
            this.ignoreUpdates = true;
            this.router.navigate([], { relativeTo: this.route, queryParams: { step: this.selectedStepIndex + 1, line: this.selectedLogIndex + 1 }, queryParamsHandling: 'merge' });
        }
    }

    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
    }

    closeLog() {
        this.onCloseLog.emit();
        this.disconnect();
    }

    cancelBuild() {
        this.cancelling = true;
        this.modpackBuildProcessService.cancel(this.build, () => {
            this.cancelling = false;
        });
    }

    rebuild() {
        this.modpackBuildProcessService.rebuild(this.build);
    }

    get anySkipped() {
        return this.build.steps.findIndex(x => x.buildResult === ModpackBuildResult.SKIPPED) !== -1;
    }

    getLogItemColour(index: number): string {
        if (index === 0) {
            if (this.selectedStep.running) {
                return '#0c78ff';
            } else if (this.selectedStep.finished) {
                if (this.selectedStep.buildResult === ModpackBuildResult.SUCCESS) {
                    return 'green';
                } else if (this.selectedStep.buildResult === ModpackBuildResult.FAILED) {
                    return 'red';
                } else if (this.selectedStep.buildResult === ModpackBuildResult.CANCELLED) {
                    return 'goldenrod';
                } else if (this.selectedStep.buildResult === ModpackBuildResult.SKIPPED) {
                    return 'orange';
                }
            }
        }

        if (this.selectedStep.logs[index].colour !== '') {
            return this.selectedStep.logs[index].colour;
        }

        if (this.theme === undefined) {
            return '';
        }

        if (index > 0 && index < this.selectedStep.logs.length - 1) {
            return this.theme.foregroundColor;
        }

        return this.theme.foregroundColor;
    }
}
