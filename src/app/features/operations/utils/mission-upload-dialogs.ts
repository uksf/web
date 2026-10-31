import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { MissionReport } from '../models/game-server';
import { UksfError } from '@app/shared/models/response';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { ValidationReportModalComponent } from '@app/shared/modals/validation-report-modal/validation-report-modal.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';

export function showMissionReports(dialog: MatDialog, reports: MissionReport[]) {
    const report = reports.shift()!;
    let reportDialogClose: Observable<boolean>;
    if (report.reports.length > 0) {
        reportDialogClose = dialog.open(ValidationReportModalComponent, {
            data: { title: `Mission file: ${report.mission}`, messages: report.reports }
        }).afterClosed();
    } else {
        reportDialogClose = dialog.open(MessageModalComponent, {
            data: { message: `Successfully uploaded '${report.mission}'` }
        }).afterClosed();
    }
    reportDialogClose.pipe(first()).subscribe({
        next: () => {
            if (reports.length > 0) {
                showMissionReports(dialog, reports);
            }
        }
    });
}

export function showMissionError(dialog: MatDialog, error: UksfError, fallbackMessage = '') {
    let message = 'An error occurred';
    if (error.error && typeof error.error === 'string') {
        message = error.error;
    } else if (fallbackMessage) {
        message = fallbackMessage;
    }
    dialog.open(MessageModalComponent, { data: { message } });
}

export function confirmDroppedPbos(dialog: MatDialog, pboFiles: File[], invalidFiles: File[], upload: (files: File[]) => void) {
    if (pboFiles.length === 0 && invalidFiles.length === 0) return;

    if (pboFiles.length === 0) {
        dialog.open(MessageModalComponent, {
            data: { message: 'None of those files are PBO files' }
        });
    } else if (invalidFiles.length > 0) {
        let message = 'Some of those files are not PBOs. Would you like to continue uploading the following files:\n';
        pboFiles.forEach((file) => { message += `\n${file.name}`; });
        dialog.open(ConfirmationModalComponent, {
            data: { message }
        }).afterClosed().pipe(first()).subscribe({
            next: (result) => {
                if (result) {
                    upload(pboFiles);
                }
            }
        });
    } else {
        upload(pboFiles);
    }
}

export interface DroppedFile {
    relativePath: string;
    fileEntry: { file: (cb: (f: File) => void) => void };
}

export function splitDroppedPbos(files: DroppedFile[], done: (pboFiles: File[], invalidFiles: File[]) => void) {
    if (files.length === 0) return;

    const pboFiles: File[] = [];
    const invalidFiles: File[] = [];
    let resolved = 0;

    files.forEach((file) => {
        file.fileEntry.file((resolvedFile: File) => {
            const ext = file.relativePath.split('.').pop()?.toLowerCase();
            if (ext === 'pbo') {
                pboFiles.push(resolvedFile);
            } else {
                invalidFiles.push(resolvedFile);
            }
            resolved++;
            if (resolved === files.length) {
                done(pboFiles, invalidFiles);
            }
        });
    });
}

export function saveBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}
