import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material modules commonly used across features
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';

/**
 * SharedModule contains reusable components, pipes, and directives
 * used across multiple feature modules.
 *
 * Components to be migrated here:
 * - flex-filler
 * - button-pending
 * - loading-placeholder
 * - centre-wrapper
 * - main-content-area
 * - side-content-area
 * - full-content-area
 * - default-content-areas
 * - file-drop
 * - inline-edit
 * - inline-dropdown
 * - selection-list
 * - paginator
 * - dropdown
 * - dropdown-base
 * - theme-emitter
 * - maintenance
 *
 * Pipes to be migrated here:
 * - displayName
 * - time (ZonedTime, TimeAgoPipe)
 * - country
 * - AnsiToHtml
 *
 * Directives to be migrated here:
 * - character-block
 * - dropdown-validator
 * - must-match
 *
 * Usage in feature modules:
 *   imports: [SharedModule]
 */

// Commonly used Angular modules to re-export
const ANGULAR_MODULES = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
];

// Material modules to re-export
const MATERIAL_MODULES = [
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatFormFieldModule,
  MatCheckboxModule,
  MatSelectModule,
  MatDialogModule,
  MatProgressSpinnerModule,
  MatTooltipModule,
  MatMenuModule,
  MatCardModule,
];

// Shared components (to be populated during migration)
const SHARED_COMPONENTS: any[] = [
  // FlexFillerComponent,
  // LoadingPlaceholderComponent,
  // etc.
];

// Shared pipes (to be populated during migration)
const SHARED_PIPES: any[] = [
  // DisplayName,
  // ZonedTime,
  // TimeAgoPipe,
  // etc.
];

// Shared directives (to be populated during migration)
const SHARED_DIRECTIVES: any[] = [
  // CharacterBlockDirective,
  // DropdownValidatorDirective,
  // MustMatchDirective,
];

@NgModule({
  imports: [
    ...ANGULAR_MODULES,
    ...MATERIAL_MODULES,
  ],
  declarations: [
    ...SHARED_COMPONENTS,
    ...SHARED_PIPES,
    ...SHARED_DIRECTIVES,
  ],
  exports: [
    ...ANGULAR_MODULES,
    ...MATERIAL_MODULES,
    ...SHARED_COMPONENTS,
    ...SHARED_PIPES,
    ...SHARED_DIRECTIVES,
  ],
})
export class SharedModule {}
