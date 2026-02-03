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

// Services
import { AuthenticationService } from './Services/Authentication/authentication.service';

// Components
import { AppComponent } from './app.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DATE_LOCALE, MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MatMomentDateModule } from '@angular/material-moment-adapter';

import { UrlService } from './Services/url.service';
import { ProfilePageComponent } from './Pages/profile-page/profile-page.component';
import { HomePageComponent } from './Pages/home-page/home-page.component';
import { SideBarComponent } from './Components/side-bar/side-bar.component';
import { LoginPageComponent } from './Pages/login-page/login-page.component';
import { HeaderBarComponent } from './Components/header-bar/header-bar.component';
import { FooterBarComponent } from './Components/footer-bar/footer-bar.component';
import { LivePageComponent } from './Pages/live-page/live-page.component';
import { AboutPageComponent } from './Pages/about-page/about-page.component';
import { RulesPageComponent } from './Pages/rules-page/rules-page.component';
import { PolicyPageComponent } from './Pages/policy-page/policy-page.component';
import { InformationPageComponent } from './Pages/information-page/information-page.component';
import { TocList } from './Components/toc-list/toc-list.component';
import { ConnectTeamspeakModalComponent } from './Modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { ChangeFirstLastModalComponent } from './Modals/change-first-last-modal/change-first-last-modal.component';
import { ChangePasswordModalComponent } from './Modals/change-password-modal/change-password-modal.component';
import { CreateOperationReportModalComponent } from './Modals/create-operation-report-modal/create-operation-report-modal.component';
import { OprepPageComponent } from './Pages/oprep-page/oprep-page.component';
import { CreateOperationOrderComponent } from './Modals/create-operation-order/create-operation-order.component';
import { NotificationsComponent } from './Components/notifications/notifications.component';
import { OpordPageComponent } from './Pages/opord-page/opord-page.component';
import { AccountService } from './Services/account.service';
import { PermissionsService } from './Services/permissions.service';
import { SessionService } from './Services/Authentication/session.service';
import { ConfirmationModalComponent } from './Modals/confirmation-modal/confirmation-modal.component';
import { UrlSerializer } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MessageModalComponent } from './Modals/message-modal/message-modal.component';
import { AuthHttpInterceptor } from './Services/Authentication/auth-http-interceptor';
import { CountryPickerService } from './Services/CountryPicker/country-picker.service';
import { ValidationReportModalComponent } from './Modals/multiple-message-modal/validation-report-modal.component';
import { SignalRService } from './Services/signalr.service';
import { TextInputModalComponent } from './Modals/text-input-modal/text-input-modal.component';
import { ModpackBuildService } from './features/modpack/modpackBuild.service';
import { ModpackRcService } from './features/modpack/modpackRc.service';
import { DisplayNameService } from './Services/displayName.service';
import { ModpackBuildProcessService } from './features/modpack/modpackBuildProcess.service';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { CharacterBlockDirective } from './Directives/character-block.directive';
import { RequestPasswordResetComponent } from './Components/login/request-password-reset/request-password-reset.component';
import { LoginComponent } from './Components/login/login/login.component';
import { PasswordResetComponent } from './Components/login/reset-password/password-reset.component';
import { MustMatchDirective } from './Directives/must-match.directive';
import { ButtonHiddenSubmitComponent } from './Components/elements/button-submit/button-hidden-submit.component';
import { AppSettingsService } from './Services/appSettingsService.service';
import { SignalRHubsService } from './Services/signalrHubs.service';
import { QuillModule } from 'ngx-quill';
import { ModpackReleaseService } from './features/modpack/modpackRelease.service';
import { DisplayName } from './Pipes/displayName.pipe';

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
        UrlService,
        NotificationsComponent,
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
        SharedModule
    ],
    declarations: [
        AppComponent,
        HomePageComponent,
        SideBarComponent,
        LoginPageComponent,
        HeaderBarComponent,
        FooterBarComponent,
        ProfilePageComponent,
        LivePageComponent,
        AboutPageComponent,
        RulesPageComponent,
        PolicyPageComponent,
        InformationPageComponent,
        TocList,
        ConnectTeamspeakModalComponent,
        ChangeFirstLastModalComponent,
        ChangePasswordModalComponent,
        CreateOperationReportModalComponent,
        OprepPageComponent,
        CreateOperationOrderComponent,
        NotificationsComponent,
        MessageModalComponent,
        OpordPageComponent,
        ConfirmationModalComponent,
        TextInputModalComponent,
        ValidationReportModalComponent,
        CharacterBlockDirective,
        MustMatchDirective,
        LoginComponent,
        RequestPasswordResetComponent,
        PasswordResetComponent,
        ButtonHiddenSubmitComponent
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor() {}
}
