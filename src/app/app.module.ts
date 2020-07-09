// Modules
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule, LowerCaseUrlSerializer } from './app-routing.module';
import { JsonpModule } from '@angular/http';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GrowlModule } from 'primeng/primeng';
import { RatingModule } from 'primeng/primeng';
import { CarouselModule } from 'primeng/primeng';
import { OrganizationChartModule } from 'primeng/primeng';
import { ChartModule } from 'primeng/primeng';
import { MessageModule } from 'primeng/primeng';
import { JwtModule } from '@auth0/angular-jwt';
import { NgxPermissionsModule } from 'ngx-permissions';
import { TreeModule } from 'angular-tree-component';
import { MarkdownModule } from 'ngx-markdown';

// Services
import { AuthenticationService } from './Services/Authentication/authentication.service';

// Components
import { AppComponent } from './app.component';
import {
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
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
    MatToolbarModule,
    MatTooltipModule,
    MatStepperModule,
    MAT_DATE_LOCALE,
    MatTabsModule,
    MatBadgeModule,
} from '@angular/material';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MatMomentDateModule } from '@angular/material-moment-adapter';

import { UrlService } from './Services/url.service';
import { ProfilePageComponent } from './Pages/profile-page/profile-page.component';
import { HomePageComponent } from './Pages/home-page/home-page.component';
import { MainContentAreaComponent } from './Components/main-content-area/main-content-area.component';
import { SideContentAreaComponent } from './Components/side-content-area/side-content-area.component';
import { SideBarComponent } from './Components/side-bar/side-bar.component';
import { LoginPageComponent } from './Pages/login-page/login-page.component';
import { HeaderBarComponent } from './Components/header-bar/header-bar.component';
import { FooterBarComponent } from './Components/footer-bar/footer-bar.component';
import { RecruitmentPageComponent } from './Pages/recruitment-page/recruitment-page.component';
import { CentreWrapperComponent } from './Components/centre-wrapper/centre-wrapper.component';
import { NotificationsService } from './Services/notifications.service';
import { DefaultContentAreasComponent } from './Components/default-content-areas/default-content-areas.component';
import { MessagesModule } from 'primeng/primeng';
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
import { TerminalModule } from 'primeng/primeng';
import { TerminalService } from 'primeng/components/terminal/terminalservice';
import 'chart.js/dist/Chart.min.js';
import { CommandPageComponent } from './Pages/command-page/command-page.component';
import { ApiService } from './Services/api.service';
import { TocList } from './Components/toc-list/toc-list.component';
import { CommentDisplayComponent } from './Components/comment-display/comment-display.component';
import { TimeAgoPipe } from 'time-ago-pipe';
import { RequestRankModalComponent } from './Modals/command/request-rank-modal/request-rank-modal.component';
import { UnitPageComponent } from './Pages/unit-page/unit-page.component';
import { ConnectTeamspeakModalComponent } from './Modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { ChangeFirstLastModalComponent } from './Modals/change-first-last-modal/change-first-last-modal.component';
import { ChangePasswordModalComponent } from './Modals/change-password-modal/change-password-modal.component';
import { ForgotPasswordModalComponent } from './Modals/forgot-password-modal/forgot-password-modal.component';
import { ModifyUnitModalComponent } from './Modals/modify-unit-modal/modify-unit-modal.component';
import { ModifyUnitMembersModalComponent } from './Modals/modify-unit-members-modal/modify-unit-members-modal.component';
import { CreateOperationReportModalComponent } from './Modals/create-operation-report-modal/create-operation-report-modal.component';
import { OprepPageComponent } from './Pages/oprep-page/oprep-page.component';
import { FullContentAreaComponent } from './Components/full-content-area/full-content-area.component';
import { CreateOperationOrderComponent } from './Modals/create-operation-order/create-operation-order.component';
import { NotificationsComponent } from './Components/notifications/notifications.component';
import { AdminPageComponent } from './Pages/admin-page/admin-page.component';
import { AdminErrorLogsComponent } from './Components/admin/admin-error-logs/admin-error-logs.component';
import { AdminAuditLogsComponent } from './Components/admin/admin-audit-logs/admin-audit-logs.component';
import { OpordPageComponent } from './Pages/opord-page/opord-page.component';
import { EditorModule } from 'primeng/editor';
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
import { FlexFillerComponent } from './Components/flex-filler/flex-filler.component';
import { InlineEditComponent } from './Components/inline-edit/inline-edit.component';
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
import { FileDropComponent } from './Components/file-drop/file-drop.component';
import { MessageModalComponent } from './Modals/message-modal/message-modal.component';
import { ThemeEmitterComponent } from './Components/theme-emitter/theme-emitter.component';
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
import { CountryName, CountryImage } from './Pipes/country.pipe';
import { ApplicationEditComponent } from './Components/application/application-edit/application-edit.component';
import { ConnectTeamspeakComponent } from './Components/teamspeak-connect/teamspeak-connect.component';
import { MaintenanceComponent } from './Components/maintenance/maintenance.component';
import { MultipleMessageModalComponent } from './Modals/multiple-message-modal/multiple-message-modal.component';
import { SignalRService } from './Services/signalr.service';
import { AdminLauncherLogsComponent } from './Components/admin/admin-launcher-logs/admin-launcher-logs.component';
import { ZonedTime } from './Pipes/time.pipe';
import { PersonnelPageComponent } from './Pages/personnel-page/personnel-page.component';
import { PersonnelDischargesComponent } from './Components/personnel/personnel-discharges/personnel-discharges.component';
import { PersonnelLoasComponent } from './Components/personnel/personnel-loas/personnel-loas.component';
import { PersonnelActivityComponent } from './Components/personnel/personnel-activity/personnel-activity.component';
import { PersonnelLoasListComponent } from './Components/personnel/personnel-loas-list/personnel-loas-list.component';
import { TextInputModalComponent } from './Modals/text-input-modal/text-input-modal.component';
import { StatesService } from './Services/states.service';
import { ModpackGuideComponent } from './Components/modpack/modpack-guide/modpack-guide.component';
import { ModpackReleasesComponent } from './Components/modpack/modpack-releases/modpack-releases.component';
import { ModpackBuildsDevComponent } from './Components/modpack/modpack-builds-dev/modpack-builds-dev.component';
import { ModpackBuildsStageComponent } from './Components/modpack/modpack-builds-stage/modpack-builds-stage.component';
import { ModpackBuildService } from './Services/modpackBuild.service';
import { ModpackRcService } from './Services/modpackRc.service';
import { DisplayNameService } from './Services/displayName.service';
import { ModpackBuildProcessService } from './Services/modpackBuildProcess.service';
import { NewModpackBuildModalComponent } from './Modals/new-modpack-build/new-modpack-build-modal.component';
import { ModpackBuildsStepsComponent } from './Components/modpack/modpack-builds-steps/modpack-builds-steps.component';

export function initPermissions(permissionsService: PermissionsService) {
    return () => permissionsService.refresh();
}

export function initCountries(countryPickerService: CountryPickerService) {
    return () => countryPickerService.load();
}

export function tokenGetter() {
    return sessionStorage.getItem('access_token');
}

@NgModule({
    providers: [
        StatesService,
        SessionService,
        AuthenticationService,
        AccountService,
        PermissionsService,
        UrlService,
        NotificationsService,
        TerminalService,
        ApiService,
        TimeAgoPipe,
        NotificationsComponent,
        CountryPickerService,
        SignalRService,
        ModpackBuildService,
        ModpackRcService,
        ModpackBuildProcessService,
        DisplayNameService,
        {
            provide: APP_INITIALIZER,
            useFactory: initPermissions,
            deps: [PermissionsService],
            multi: true
        },
        {
            provide: APP_INITIALIZER,
            useFactory: initCountries,
            deps: [CountryPickerService],
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
    ], imports: [
        BrowserModule,
        AppRoutingModule,
        CommonModule,
        JsonpModule,
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
        MessageModule,
        MatToolbarModule,
        CarouselModule,
        OrganizationChartModule,
        TerminalModule,
        ChartModule,
        MatTooltipModule,
        MessagesModule,
        RatingModule,
        GrowlModule,
        EditorModule,
        DragDropModule,
        HttpClientModule,
        JwtModule.forRoot({
            config: {
                tokenGetter: tokenGetter,
                whitelistedDomains: ['localhost:5000', 'uk-sf.co.uk', 'www.uk-sf.co.uk', 'api.uk-sf.co.uk']
            }
        }),
        NgxPermissionsModule.forRoot(),
        TreeModule.forRoot(),
        MarkdownModule.forRoot()
    ], declarations: [
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
        TimeAgoPipe,
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
        ForgotPasswordModalComponent,
        CommentDisplayComponent,
        ModifyUnitModalComponent,
        ModifyUnitMembersModalComponent,
        CreateOperationReportModalComponent,
        OprepPageComponent,
        FullContentAreaComponent,
        CreateOperationOrderComponent,
        NotificationsComponent,
        AdminPageComponent,
        AdminErrorLogsComponent,
        AdminAuditLogsComponent,
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
        MultipleMessageModalComponent,
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
        ModpackBuildsStageComponent,
        ModpackBuildsStepsComponent,
        NewModpackBuildModalComponent
    ], bootstrap: [
        AppComponent
    ], entryComponents: [
        ConnectTeamspeakModalComponent,
        ChangeFirstLastModalComponent,
        ChangePasswordModalComponent,
        ForgotPasswordModalComponent,
        ModifyUnitModalComponent,
        ModifyUnitMembersModalComponent,
        CreateOperationReportModalComponent,
        RequestLoaModalComponent,
        RequestRankModalComponent,
        RequestDischargeModalComponent,
        RequestRoleModalComponent,
        RequestUnitRoleModalComponent,
        RequestTransferModalComponent,
        AddUnitModalComponent,
        CreateOperationOrderComponent,
        AddRankModalComponent,
        MessageModalComponent,
        CreateIssueModalComponent,
        AddServerModalComponent,
        RequestUnitRemovalModalComponent,
        EditServerModsModalComponent,
        ConfirmationModalComponent,
        MultipleMessageModalComponent,
        TextInputModalComponent,
        NewModpackBuildModalComponent
    ]
})

export class AppModule {
    constructor() { }
}
