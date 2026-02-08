// Modules
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule, LowerCaseUrlSerializer } from './app-routing.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JwtModule } from '@auth0/angular-jwt';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MarkdownModule } from 'ngx-markdown';
import { TreeModule } from '@circlon/angular-tree-component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import 'chart.js/dist/Chart.min.js';
import { EditorModule } from 'primeng/editor';
import { ChartModule } from 'primeng/chart';
import { RatingModule } from 'primeng/rating';
import { SharedModule } from '@shared/shared.module';
import { CoreModule } from './core/core.module';
import { HomeModule } from './features/home/home.module';
import { AuthModule } from './features/auth/auth.module';

// Core Services
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { UrlService } from '@app/core/services/url.service';
import { AccountService } from '@app/core/services/account.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { SessionService } from '@app/core/services/authentication/session.service';
import { AuthHttpInterceptor } from '@app/core/services/authentication/auth-http-interceptor';
import { RedirectService } from '@app/core/services/authentication/redirect.service';
import { SignalRService } from '@app/core/services/signalr.service';
import { SignalRHubsService } from '@app/core/services/signalr-hubs.service';
import { AppSettingsService } from '@app/core/services/app-settings.service';

// Shared Services
import { CountryPickerService } from '@app/shared/services/country-picker/country-picker.service';
import { DisplayNameService } from '@app/shared/services/display-name.service';

// Components
import { AppComponent } from './app.component';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MAT_DATE_LOCALE, MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MatMomentDateModule } from '@angular/material-moment-adapter';

import { UrlSerializer } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ModpackBuildService } from './features/modpack/modpackBuild.service';
import { ModpackRcService } from './features/modpack/modpackRc.service';
import { ModpackBuildProcessService } from './features/modpack/modpackBuildProcess.service';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { QuillModule } from 'ngx-quill';
import { ModpackReleaseService } from './features/modpack/modpackRelease.service';
import { DisplayName } from '@app/shared/pipes/displayName.pipe';

export function initApp(appSettingsService: AppSettingsService, injector: Injector, countryPickerService: CountryPickerService) {
    return () => {
        countryPickerService.load().then();
        return appSettingsService.loadAppSettings().then(() => {
            const permissionsService = injector.get(PermissionsService);
            return permissionsService.refresh();
        });
    };
}

export function tokenGetter() {
    return sessionStorage.getItem('access_token');
}

@NgModule({
    providers: [
        AppSettingsService,
        SessionService,
        AuthenticationService,
        AccountService,
        PermissionsService,
        RedirectService,
        UrlService,
        CountryPickerService,
        SignalRService,
        SignalRHubsService,
        ModpackBuildService,
        ModpackRcService,
        ModpackBuildProcessService,
        ModpackReleaseService,
        DisplayNameService,
        {
            provide: APP_INITIALIZER,
            useFactory: initApp,
            deps: [AppSettingsService, Injector, CountryPickerService],
            multi: true
        },
        { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
        { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },
        { provide: UrlSerializer, useClass: LowerCaseUrlSerializer },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthHttpInterceptor,
            multi: true
        }
    ],
    imports: [
        BrowserModule,
        ClipboardModule,
        AppRoutingModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatNativeDateModule,
        MatAutocompleteModule,
        MatBadgeModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatChipsModule,
        MatStepperModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatDialogModule,
        MatExpansionModule,
        MatGridListModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatRadioModule,
        MatRippleModule,
        MatSelectModule,
        MatSidenavModule,
        MatSliderModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatSortModule,
        MatTableModule,
        MatTabsModule,
        MatToolbarModule,
        ScrollingModule,
        OrganizationChartModule,
        ChartModule,
        TreeModule,
        MatTooltipModule,
        RatingModule,
        EditorModule,
        DragDropModule,
        HttpClientModule,
        JwtModule.forRoot({
            config: {
                tokenGetter: tokenGetter,
                allowedDomains: ['localhost:5000', 'localhost:5500', 'uk-sf.co.uk', 'www.uk-sf.co.uk', 'api.uk-sf.co.uk', 'dev.uk-sf.co.uk', 'api-dev.uk-sf.co.uk']
            }
        }),
        NgxPermissionsModule.forRoot(),
        MarkdownModule.forRoot(),
        QuillModule.forRoot(),
        DisplayName,
        NgOptimizedImage,
        SharedModule,
        CoreModule,
        HomeModule,
        AuthModule,
    ],
    declarations: [
        AppComponent,
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor() {}
}
