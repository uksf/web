import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material modules commonly used across features
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
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

// Shared Components - Elements
import { FlexFillerComponent } from './components/elements/flex-filler/flex-filler.component';
import { ButtonComponent } from './components/elements/button-pending/button.component';
import { ButtonHiddenSubmitComponent } from './components/elements/button-submit/button-hidden-submit.component';
import { LoadingPlaceholderComponent } from './components/elements/loading-placeholder/loading-placeholder.component';
import { CentreWrapperComponent } from './components/elements/centre-wrapper/centre-wrapper.component';
import { InlineEditComponent } from './components/elements/inline-edit/inline-edit.component';
import { InlineDropdownComponent } from './components/elements/inline-dropdown/inline-dropdown.component';
import { PaginatorComponent } from './components/elements/paginator/paginator.component';
import { DropdownComponent } from './components/elements/dropdown/dropdown.component';
import { DropdownBaseComponent } from './components/elements/dropdown-base/dropdown-base.component';
import { SelectionListComponent } from './components/elements/selection-list/selection-list.component';
import { MaintenanceComponent } from './components/elements/maintenance/maintenance.component';
import { FileDropComponent } from './components/elements/file-drop/file-drop.component';
import { AutofocusStopComponent } from './components/elements/autofocus-stop/autofocus-stop.component';
import { ModelValueDebugComponent, ReactiveFormValueDebugComponent, TemplateFormValueDebugComponent } from './components/elements/form-value-debug/form-value-debug.component';
import { ThemeEmitterComponent } from './components/elements/theme-emitter/theme-emitter.component';

// Shared Components - Content Areas
import { MainContentAreaComponent } from './components/content-areas/main-content-area/main-content-area.component';
import { SideContentAreaComponent } from './components/content-areas/side-content-area/side-content-area.component';
import { FullContentAreaComponent } from './components/content-areas/full-content-area/full-content-area.component';
import { DefaultContentAreasComponent } from './components/content-areas/default-content-areas/default-content-areas.component';

// Shared Components - Other
import { CommentDisplayComponent } from './components/comment-display/comment-display.component';
import { ConnectTeamspeakComponent } from './components/teamspeak-connect/teamspeak-connect.component';
import { TocList } from './components/toc-list/toc-list.component';

// Shared Modals
import { MessageModalComponent } from './modals/message-modal/message-modal.component';
import { ConfirmationModalComponent } from './modals/confirmation-modal/confirmation-modal.component';
import { TextInputModalComponent } from './modals/text-input-modal/text-input-modal.component';
import { ValidationReportModalComponent } from './modals/validation-report-modal/validation-report-modal.component';
import { RequestLoaModalComponent } from './modals/request-loa-modal/request-loa-modal.component';

// Shared Pipes
import { CountryImage, CountryName } from './pipes/country.pipe';
import { ZonedTime, TimeAgoPipe } from './pipes/time.pipe';
import { AnsiToHtmlPipe } from './pipes/ansi-to-html.pipe';

// Shared Directives
import { MustSelectFromDropdownValidatorDirective } from './directives/dropdown-validator.directive';
import { CharacterBlockDirective } from './directives/character-block.directive';
import { MustMatchDirective } from './directives/must-match.directive';
import { SpotlightDirective } from './directives/spotlight.directive';

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
    RouterModule,
];

// Material modules to re-export
const MATERIAL_MODULES = [
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
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
    // Elements
    FlexFillerComponent,
    ButtonComponent,
    ButtonHiddenSubmitComponent,
    LoadingPlaceholderComponent,
    CentreWrapperComponent,
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
    ThemeEmitterComponent,
    // Content Areas
    MainContentAreaComponent,
    SideContentAreaComponent,
    FullContentAreaComponent,
    DefaultContentAreasComponent,
    // Other
    CommentDisplayComponent,
    ConnectTeamspeakComponent,
    TocList,
];

// Shared modals
const SHARED_MODALS = [
    MessageModalComponent,
    ConfirmationModalComponent,
    TextInputModalComponent,
    ValidationReportModalComponent,
    RequestLoaModalComponent,
];

// Shared pipes
const SHARED_PIPES = [
    CountryImage,
    CountryName,
    ZonedTime,
    TimeAgoPipe,
    AnsiToHtmlPipe,
];

// Shared directives
const SHARED_DIRECTIVES = [
    MustSelectFromDropdownValidatorDirective,
    CharacterBlockDirective,
    MustMatchDirective,
    SpotlightDirective,
];

@NgModule({
    imports: [
        ...ANGULAR_MODULES,
        ...MATERIAL_MODULES,
    ],
    declarations: [
        ...SHARED_COMPONENTS,
        ...SHARED_MODALS,
        ...SHARED_PIPES,
        ...SHARED_DIRECTIVES,
    ],
    exports: [
        ...ANGULAR_MODULES,
        ...MATERIAL_MODULES,
        ...SHARED_COMPONENTS,
        ...SHARED_MODALS,
        ...SHARED_PIPES,
        ...SHARED_DIRECTIVES,
    ],
})
export class SharedModule {}
