import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material modules commonly used across features
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

// CDK modules
import { ScrollingModule } from '@angular/cdk/scrolling';

// Shared Components
import { FlexFillerComponent } from '@app/Components/elements/flex-filler/flex-filler.component';
import { ButtonComponent } from '@app/Components/elements/button-pending/button.component';
import { LoadingPlaceholderComponent } from '@app/Components/elements/loading-placeholder/loading-placeholder.component';
import { CentreWrapperComponent } from '@app/Components/elements/centre-wrapper/centre-wrapper.component';
import { MainContentAreaComponent } from '@app/Components/content-areas/main-content-area/main-content-area.component';
import { SideContentAreaComponent } from '@app/Components/content-areas/side-content-area/side-content-area.component';
import { FullContentAreaComponent } from '@app/Components/content-areas/full-content-area/full-content-area.component';
import { DefaultContentAreasComponent } from '@app/Components/content-areas/default-content-areas/default-content-areas.component';
import { InlineEditComponent } from '@app/Components/elements/inline-edit/inline-edit.component';
import { InlineDropdownComponent } from '@app/Components/elements/inline-dropdown/inline-dropdown.component';
import { PaginatorComponent } from '@app/Components/elements/paginator/paginator.component';
import { DropdownComponent } from '@app/Components/elements/dropdown/dropdown.component';
import { DropdownBaseComponent } from '@app/Components/elements/dropdown-base/dropdown-base.component';
import { SelectionListComponent } from '@app/Components/elements/selection-list/selection-list.component';
import { MaintenanceComponent } from '@app/Components/elements/maintenance/maintenance.component';
import { FileDropComponent } from '@app/Components/elements/file-drop/file-drop.component';
import { AutofocusStopComponent } from '@app/Components/elements/autofocus-stop/autofocus-stop.component';
import { ModelValueDebugComponent, ReactiveFormValueDebugComponent, TemplateFormValueDebugComponent } from '@app/Components/elements/form-value-debug/form-value-debug.component';
import { CommentDisplayComponent } from '@app/Components/comment-display/comment-display.component';
import { ConnectTeamspeakComponent } from '@app/Components/teamspeak-connect/teamspeak-connect.component';
import { ThemeEmitterComponent } from '@app/Components/elements/theme-emitter/theme-emitter.component';

// Shared Pipes
import { CountryImage, CountryName } from '@app/Pipes/country.pipe';
import { ZonedTime } from '@app/Pipes/time.pipe';

// Shared Directives
import { MustSelectFromDropdownValidatorDirective } from '@app/Directives/dropdown-validator.directive';

/**
 * SharedModule contains reusable components, pipes, and directives
 * used across multiple feature modules.
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
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatTooltipModule,
  ScrollingModule,
];

// Shared components
const SHARED_COMPONENTS = [
  FlexFillerComponent,
  ButtonComponent,
  LoadingPlaceholderComponent,
  CentreWrapperComponent,
  MainContentAreaComponent,
  SideContentAreaComponent,
  FullContentAreaComponent,
  DefaultContentAreasComponent,
  InlineEditComponent,
  InlineDropdownComponent,
  PaginatorComponent,
  DropdownComponent,
  DropdownBaseComponent,
  SelectionListComponent,
  MaintenanceComponent,
  FileDropComponent,
  AutofocusStopComponent,
  ModelValueDebugComponent,
  ReactiveFormValueDebugComponent,
  TemplateFormValueDebugComponent,
  CommentDisplayComponent,
  ConnectTeamspeakComponent,
  ThemeEmitterComponent,
];

// Shared pipes
const SHARED_PIPES = [
  CountryImage,
  CountryName,
  ZonedTime,
];

// Shared directives
const SHARED_DIRECTIVES = [
  MustSelectFromDropdownValidatorDirective,
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
