import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';

/**
 * Providers for modal components that need MatDialogRef and MAT_DIALOG_DATA.
 */
export function modalProviders(data: any = {}) {
    return [
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: data }
    ];
}

/**
 * Common imports for modal stories.
 */
export const modalImports = [MatDialogModule, ReactiveFormsModule, FormsModule];
