import { ThemeEmitterComponent } from '@app/shared/components/elements/theme-emitter/theme-emitter.component';
import { ModpackBuildStep } from '../models/modpack-build-step';
import { ModpackBuildResult } from '../models/modpack-build-result';

const finishedHeaderColours: Partial<Record<ModpackBuildResult, string>> = {
    [ModpackBuildResult.SUCCESS]: 'green',
    [ModpackBuildResult.FAILED]: 'red',
    [ModpackBuildResult.CANCELLED]: 'goldenrod',
    [ModpackBuildResult.WARNING]: 'orangered',
    [ModpackBuildResult.SKIPPED]: 'gray'
};

export function logItemColour(step: ModpackBuildStep, index: number, theme: ThemeEmitterComponent | undefined): string {
    if (index === 0) {
        if (step.running) {
            return '#0c78ff';
        }
        const headerColour = step.finished ? finishedHeaderColours[step.buildResult] : undefined;
        if (headerColour) {
            return headerColour;
        }
    }

    if (step.logs[index].colour !== '') {
        return step.logs[index].colour;
    }

    return theme?.foregroundColor ?? '';
}
