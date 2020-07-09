import { Component, ViewChild, OnDestroy, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ModpackBuildStep } from 'app/Models/ModpackBuildStep';
import { ThemeEmitterComponent } from 'app/Components/theme-emitter/theme-emitter.component';
import { ModpackBuildResult } from 'app/Models/ModpackBuildResult';
import { ModpackBuildProcessService } from 'app/Services/modpackBuildProcess.service';
import { ConnectionContainer, SignalRService } from 'app/Services/signalr.service';

@Component({
    selector: 'app-modpack-builds-steps',
    templateUrl: './modpack-builds-steps.component.html',
    styleUrls: ['../../../Pages/modpack-page/modpack-page.component.scss', './modpack-builds-steps.component.scss', './modpack-builds-steps.component.scss-theme.scss']
})
export class ModpackBuildsStepsComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChild(ThemeEmitterComponent, { static: false }) theme: ThemeEmitterComponent;
    @Input() build: ModpackBuild;
    @Output() onCloseLog = new EventEmitter();
    private hubConnection: ConnectionContainer;
    modpackBuildResult = ModpackBuildResult;
    selectedStepIndex = 0;
    overrideRunningStepIndex = false;
    cancelling = false;

    constructor(
        private signalrService: SignalRService,
        private modpackBuildProcessService: ModpackBuildProcessService
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
        this.disconnect();
        this.connect();
    }

    get selectedStep(): ModpackBuildStep {
        return this.build && this.build.steps.length > this.selectedStepIndex ? this.build.steps[this.selectedStepIndex] : undefined;
    }

    selectStep(index: number, override: boolean = false) {
        this.selectedStepIndex = index;
        const runningIndex = this.build.steps.findIndex(x => x.running);
        if (runningIndex !== -1) {
            this.overrideRunningStepIndex = this.selectedStepIndex === runningIndex ? false : override;
        }
    }

    chooseStep() {
        if (this.overrideRunningStepIndex) {
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
            } else {
                this.selectStep(this.build.steps.length - 1);
            }
        } else {
            this.selectStep(0);
        }
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
