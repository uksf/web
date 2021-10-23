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
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MatMomentDateModule } from '@angular/material-moment-adapter';

import { UrlService } from './Services/url.service';
import { ProfilePageComponent } from './Pages/profile-page/profile-page.component';
import { HomePageComponent } from './Pages/home-page/home-page.component';
import { MainContentAreaComponent } from './Components/content-areas/main-content-area/main-content-area.component';
import { SideContentAreaComponent } from './Components/content-areas/side-content-area/side-content-area.component';
import { SideBarComponent } from './Components/side-bar/side-bar.component';
import { LoginPageComponent } from './Pages/login-page/login-page.component';
import { HeaderBarComponent } from './Components/header-bar/header-bar.component';
import { FooterBarComponent } from './Components/footer-bar/footer-bar.component';
import { RecruitmentPageComponent } from './Pages/recruitment-page/recruitment-page.component';
import { CentreWrapperComponent } from './Components/elements/centre-wrapper/centre-wrapper.component';
import { DefaultContentAreasComponent } from './Components/content-areas/default-content-areas/default-content-areas.component';
import { RecruitmentApplicationPageComponent } from './Pages/recruitment-application-page/recruitment-application-page.component';
import { LivePageComponent } from './Pages/live-page/live-page.component';
import { UnitsPageComponent } from './Pages/units-page/units-page.component';
import { AboutPageComponent } from './Pages/about-page/about-page.component';
import { DocsPageComponent } from './Pages/docs-page/docs-page.component';
import { RulesPageComponent } from './Pages/rules-page/rules-page.component';
import { OperationsPageComponent } from './Pages/operations-page/operations-page.component';
import { PolicyPageComponent } from './Pages/policy-page/policy-page.component';
import { InformationPageComponent } from './Pages/information-page/information-page.component';
import { ModpackPageComponent } from './Pages/modpack-page/modpack-page.component';
import 'chart.js/dist/Chart.min.js';
import { CommandPageComponent } from './Pages/command-page/command-page.component';
import { TocList } from './Components/toc-list/toc-list.component';
import { CommentDisplayComponent } from './Components/comment-display/comment-display.component';
import { RequestRankModalComponent } from './Modals/command/request-rank-modal/request-rank-modal.component';
import { UnitPageComponent } from './Pages/unit-page/unit-page.component';
import { ConnectTeamspeakModalComponent } from './Modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { ChangeFirstLastModalComponent } from './Modals/change-first-last-modal/change-first-last-modal.component';
import { ChangePasswordModalComponent } from './Modals/change-password-modal/change-password-modal.component';
import { CreateOperationReportModalComponent } from './Modals/create-operation-report-modal/create-operation-report-modal.component';
import { OprepPageComponent } from './Pages/oprep-page/oprep-page.component';
import { FullContentAreaComponent } from './Components/content-areas/full-content-area/full-content-area.component';
import { CreateOperationOrderComponent } from './Modals/create-operation-order/create-operation-order.component';
import { NotificationsComponent } from './Components/notifications/notifications.component';
import { AdminPageComponent } from './Pages/admin-page/admin-page.component';
import { AdminErrorLogsComponent } from './Components/admin/admin-error-logs/admin-error-logs.component';
import { AdminAuditLogsComponent } from './Components/admin/admin-audit-logs/admin-audit-logs.component';
import { OpordPageComponent } from './Pages/opord-page/opord-page.component';
import { UnitsOrbatComponent } from './Components/units/units-orbat/units-orbat.component';
import { UnitsOrbatAuxComponent } from './Components/units/units-orbat-aux/units-orbat-aux.component';
import { UnitsRosterComponent } from './Components/units/units-roster/units-roster.component';
import { AccountService } from './Services/account.service';
import { PermissionsService } from './Services/permissions.service';
import { SessionService } from './Services/Authentication/session.service';
import { CommandUnitsComponent } from './Components/command/command-units/command-units.component';
import { CommandRolesComponent } from './Components/command/command-roles/command-roles.component';
import { CommandRanksComponent } from './Components/command/command-ranks/command-ranks.component';
import { AddRankModalComponent } from './Modals/command/add-rank-modal/add-rank-modal.component';
import { FlexFillerComponent } from './Components/elements/flex-filler/flex-filler.component';
import { InlineEditComponent } from './Components/elements/inline-edit/inline-edit.component';
import { RequestLoaModalComponent } from './Modals/command/request-loa-modal/request-loa-modal.component';
import { RequestDischargeModalComponent } from './Modals/command/request-discharge-modal/request-discharge-modal.component';
import { RequestRoleModalComponent } from './Modals/command/request-role-modal/request-role-modal.component';
import { RequestTransferModalComponent } from './Modals/command/request-transfer-modal/request-transfer-modal.component';
import { RequestUnitRoleModalComponent } from './Modals/command/request-unit-role-modal/request-unit-role-modal.component';
import { CommandRequestsComponent } from './Components/command/command-requests/command-requests.component';
import { AddUnitModalComponent } from './Modals/command/add-unit-modal/add-unit-modal.component';
import { CreateIssueModalComponent } from './Modals/create-issue-modal/create-issue-modal.component';
import { OperationsActivityComponent } from './Components/operations/operations-activity/operations-activity.component';
import { OperationsOrdersComponent } from './Components/operations/operations-orders/operations-orders.component';
import { OperationsReportsComponent } from './Components/operations/operations-reports/operations-reports.component';
import { OperationsServersComponent } from './Components/operations/operations-servers/operations-servers.component';
import { AddServerModalComponent } from './Modals/operations/add-server-modal/add-server-modal.component';
import { RequestUnitRemovalModalComponent } from './Modals/command/request-unit-removal-modal/request-unit-removal-modal.component';
import { AdminVariablesComponent } from './Components/admin/admin-variables/admin-variables.component';
import { EditServerModsModalComponent } from './Modals/operations/edit-server-mods-modal/edit-server-mods-modal.component';
import { AdminLogsComponent } from './Components/admin/admin-logs/admin-logs.component';
import { ConfirmationModalComponent } from './Modals/confirmation-modal/confirmation-modal.component';
import { UrlSerializer } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FileDropComponent } from './Components/elements/file-drop/file-drop.component';
import { MessageModalComponent } from './Modals/message-modal/message-modal.component';
import { ThemeEmitterComponent } from './Components/elements/theme-emitter/theme-emitter.component';
import { AdminToolsComponent } from './Components/admin/admin-tools/admin-tools.component';
import { AuthHttpInterceptor } from './Services/Authentication/auth-http-interceptor';
import { CountryPickerService } from './Services/CountryPicker/country-picker.service';
import { ApplicationPageComponent } from './Pages/application-page/application-page.component';
import { ApplicationInfoComponent } from './Components/application/application-info/application-info.component';
import { ApplicationIdentityComponent } from './Components/application/application-identity/application-identity.component';
import { ApplicationEmailConfirmationComponent } from './Components/application/application-email-confirmation/application-email-confirmation.component';
import { ApplicationCommunicationsComponent } from './Components/application/application-communications/application-communications.component';
import { ApplicationDetailsComponent } from './Components/application/application-details/application-details.component';
import { ApplicationSubmitComponent } from './Components/application/application-submit/application-submit.component';
import { CountryImage, CountryName } from './Pipes/country.pipe';
import { ApplicationEditComponent } from './Components/application/application-edit/application-edit.component';
import { ConnectTeamspeakComponent } from './Components/teamspeak-connect/teamspeak-connect.component';
import { MaintenanceComponent } from './Components/elements/maintenance/maintenance.component';
import { ValidationReportModalComponent } from './Modals/multiple-message-modal/validation-report-modal.component';
import { SignalRService } from './Services/signalr.service';
import { AdminLauncherLogsComponent } from './Components/admin/admin-launcher-logs/admin-launcher-logs.component';
import { PersonnelPageComponent } from './Pages/personnel-page/personnel-page.component';
import { PersonnelDischargesComponent } from './Components/personnel/personnel-discharges/personnel-discharges.component';
import { PersonnelLoasComponent } from './Components/personnel/personnel-loas/personnel-loas.component';
import { PersonnelActivityComponent } from './Components/personnel/personnel-activity/personnel-activity.component';
import { PersonnelLoasListComponent } from './Components/personnel/personnel-loas-list/personnel-loas-list.component';
import { TextInputModalComponent } from './Modals/text-input-modal/text-input-modal.component';
import { ModpackGuideComponent } from './Components/modpack/modpack-guide/modpack-guide.component';
import { ModpackReleasesComponent } from './Components/modpack/modpack-releases/modpack-releases.component';
import { ModpackBuildsDevComponent } from './Components/modpack/modpack-builds-dev/modpack-builds-dev.component';
import { ModpackBuildsRcComponent } from './Components/modpack/modpack-builds-rc/modpack-builds-rc.component';
import { ModpackBuildService } from './Services/modpackBuild.service';
import { ModpackRcService } from './Services/modpackRc.service';
import { DisplayNameService } from './Services/displayName.service';
import { ModpackBuildProcessService } from './Services/modpackBuildProcess.service';
import { NewModpackBuildModalComponent } from './Modals/new-modpack-build/new-modpack-build-modal.component';
import { ModpackBuildsStepsComponent } from './Components/modpack/modpack-builds-steps/modpack-builds-steps.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { EditorModule } from 'primeng/editor';
import { ChartModule } from 'primeng/chart';
import { RatingModule } from 'primeng/rating';
import { TimeAgoPipe, ZonedTime } from './Pipes/time.pipe';
import { AdminDiscordLogsComponent } from './Components/admin/admin-discord-logs/admin-discord-logs.component';
import { CharacterBlockDirective } from './Directives/character-block.directive';
import { RequestPasswordResetComponent } from './Components/login/request-password-reset/request-password-reset.component';
import { LoginComponent } from './Components/login/login/login.component';
import { PasswordResetComponent } from './Components/login/reset-password/password-reset.component';
import { MustMatchDirective } from './Directives/must-match.directive';
import { ButtonPendingComponent } from './Components/elements/button-pending/button-pending.component';
import { ButtonSubmitComponent } from './Components/elements/button-submit/button-submit.component';
import { AppSettingsService } from './Services/appSettingsService.service';
import { AutofocusStopComponent } from './Components/elements/autofocus-stop/autofocus-stop.component';
import { DropdownComponent } from './Components/elements/dropdown/dropdown.component';
import { SelectionListComponent } from './Components/elements/selection-list/selection-list.component';
import { MustSelectFromDropdownValidatorDirective } from './Directives/dropdown-validator.directive';
import { ModelValueDebugComponent, ReactiveFormValueDebugComponent, TemplateFormValueDebugComponent } from './Components/elements/form-value-debug/form-value-debug.component';
import { CommandMembersComponent } from './Components/command/command-members/command-members.component';
import { PaginatorComponent } from './Components/elements/paginator/paginator.component';
import { CommandMemberCardComponent } from './Components/command/command-members/command-member-card/command-member-card.component';
import { CommandUnitGroupCardComponent } from './Components/command/command-members/command-unit-group-card/command-unit-group-card.component';
import { SignalRHubsService } from './Services/signalrHubs.service';
import { InlineDropdownComponent } from './Components/elements/inline-dropdown/inline-dropdown.component';
import { DropdownBaseComponent } from './Components/elements/dropdown-base/dropdown-base.component';
import { AdminServersComponent } from './Components/admin/admin-servers/admin-servers.component';
import { LoadingPlaceholderComponent } from './Components/elements/loading-placeholder/loading-placeholder.component';

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
        MarkdownModule.forRoot()
    ],
    declarations: [
        AppComponent,
        FlexFillerComponent,
        HomePageComponent,
        SideBarComponent,
        LoginPageComponent,
        HeaderBarComponent,
        FooterBarComponent,
        ProfilePageComponent,
        RecruitmentPageComponent,
        MainContentAreaComponent,
        SideContentAreaComponent,
        CentreWrapperComponent,
        RecruitmentApplicationPageComponent,
        DefaultContentAreasComponent,
        LivePageComponent,
        UnitsPageComponent,
        AboutPageComponent,
        DocsPageComponent,
        RulesPageComponent,
        OperationsPageComponent,
        PolicyPageComponent,
        InformationPageComponent,
        ModpackPageComponent,
        CommandPageComponent,
        TocList,
        RequestRankModalComponent,
        RequestRoleModalComponent,
        RequestLoaModalComponent,
        RequestDischargeModalComponent,
        RequestUnitRoleModalComponent,
        RequestTransferModalComponent,
        UnitPageComponent,
        UnitsOrbatComponent,
        UnitsOrbatAuxComponent,
        UnitsRosterComponent,
        ConnectTeamspeakModalComponent,
        ChangeFirstLastModalComponent,
        ChangePasswordModalComponent,
        CommentDisplayComponent,
        CreateOperationReportModalComponent,
        OprepPageComponent,
        FullContentAreaComponent,
        CreateOperationOrderComponent,
        NotificationsComponent,
        AdminPageComponent,
        AdminErrorLogsComponent,
        AdminAuditLogsComponent,
        AdminDiscordLogsComponent,
        MessageModalComponent,
        OpordPageComponent,
        CommandRequestsComponent,
        CommandUnitsComponent,
        CommandRolesComponent,
        CommandRanksComponent,
        AddRankModalComponent,
        AddUnitModalComponent,
        InlineEditComponent,
        CreateIssueModalComponent,
        OperationsActivityComponent,
        OperationsOrdersComponent,
        OperationsReportsComponent,
        OperationsServersComponent,
        AddServerModalComponent,
        RequestUnitRemovalModalComponent,
        AdminVariablesComponent,
        EditServerModsModalComponent,
        AdminLogsComponent,
        ConfirmationModalComponent,
        TextInputModalComponent,
        FileDropComponent,
        ThemeEmitterComponent,
        AdminToolsComponent,
        ApplicationPageComponent,
        ApplicationInfoComponent,
        ApplicationIdentityComponent,
        ApplicationEmailConfirmationComponent,
        ApplicationCommunicationsComponent,
        ApplicationDetailsComponent,
        ApplicationSubmitComponent,
        ApplicationEditComponent,
        CountryName,
        CountryImage,
        ConnectTeamspeakComponent,
        MaintenanceComponent,
        ValidationReportModalComponent,
        AdminLauncherLogsComponent,
        ZonedTime,
        PersonnelPageComponent,
        PersonnelLoasComponent,
        PersonnelActivityComponent,
        PersonnelDischargesComponent,
        PersonnelLoasListComponent,
        ModpackGuideComponent,
        ModpackReleasesComponent,
        ModpackBuildsDevComponent,
        ModpackBuildsRcComponent,
        ModpackBuildsStepsComponent,
        NewModpackBuildModalComponent,
        TimeAgoPipe,
        CharacterBlockDirective,
        MustMatchDirective,
        MustSelectFromDropdownValidatorDirective,
        LoginComponent,
        RequestPasswordResetComponent,
        PasswordResetComponent,
        ButtonPendingComponent,
        ButtonSubmitComponent,
        AutofocusStopComponent,
        DropdownComponent,
        DropdownBaseComponent,
        InlineDropdownComponent,
        ReactiveFormValueDebugComponent,
        TemplateFormValueDebugComponent,
        ModelValueDebugComponent,
        CommandMembersComponent,
        PaginatorComponent,
        CommandMemberCardComponent,
        CommandUnitGroupCardComponent,
        SelectionListComponent,
        AdminServersComponent,
        LoadingPlaceholderComponent
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor() {}
}
