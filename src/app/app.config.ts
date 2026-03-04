import { APP_INITIALIZER, ApplicationConfig, ENVIRONMENT_INITIALIZER, inject, Injectable, Injector, provideZoneChangeDetection } from '@angular/core';
import { DefaultUrlSerializer, provideRouter, UrlSerializer, UrlTree } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { importProvidersFrom } from '@angular/core';
import { JwtModule } from '@auth0/angular-jwt';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MarkdownModule, MARKED_OPTIONS } from 'ngx-markdown';
import { QuillModule } from 'ngx-quill';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

import { appRoutes } from './app.routes';
import { setAppInjector } from './login-redirect';

// Core Services (not providedIn: 'root')
import { AppSettingsService } from '@app/core/services/app-settings.service';
import { SessionService } from '@app/core/services/authentication/session.service';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { AccountService } from '@app/core/services/account.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { RedirectService } from '@app/core/services/authentication/redirect.service';
import { UrlService } from '@app/core/services/url.service';
import { SignalRService } from '@app/core/services/signalr.service';
import { authHttpInterceptor } from '@app/core/services/authentication/auth-http-interceptor';

// Shared Services (not providedIn: 'root')
import { CountryPickerService } from '@app/shared/services/country-picker/country-picker.service';
import { DisplayNameService } from '@app/shared/services/display-name.service';

// Modpack Services (not providedIn: 'root', used globally)
import { ModpackBuildService } from './features/modpack/modpackBuild.service';
import { ModpackRcService } from './features/modpack/modpackRc.service';
import { ModpackBuildProcessService } from './features/modpack/modpackBuildProcess.service';
import { ModpackReleaseService } from './features/modpack/modpackRelease.service';

// Home Service (not providedIn: 'root')
import { HomeService } from './features/home/services/home.service';

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

@Injectable()
export class LowerCaseUrlSerializer extends DefaultUrlSerializer {
    parse(url: string): UrlTree {
        return super.parse(url.toLowerCase());
    }
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(appRoutes),
        provideHttpClient(withInterceptors([authHttpInterceptor]), withInterceptorsFromDi()),
        provideAnimationsAsync(),
        provideNativeDateAdapter(),
        importProvidersFrom(
            JwtModule.forRoot({
                config: {
                    tokenGetter: tokenGetter,
                    allowedDomains: ['localhost:5000', 'localhost:5500', 'uk-sf.co.uk', 'www.uk-sf.co.uk', 'api.uk-sf.co.uk', 'dev.uk-sf.co.uk', 'api-dev.uk-sf.co.uk']
                }
            }),
            NgxPermissionsModule.forRoot(),
            MarkdownModule.forRoot({
                markedOptions: {
                    provide: MARKED_OPTIONS,
                    useValue: { async: false },
                },
            }),
            QuillModule.forRoot()
        ),
        // Core services
        AppSettingsService,
        SessionService,
        AuthenticationService,
        AccountService,
        PermissionsService,
        RedirectService,
        UrlService,
        SignalRService,
        // Shared services
        CountryPickerService,
        DisplayNameService,
        // Modpack services (global singletons)
        ModpackBuildService,
        ModpackRcService,
        ModpackBuildProcessService,
        ModpackReleaseService,
        // Home service
        HomeService,
        // App initializer
        {
            provide: APP_INITIALIZER,
            useFactory: initApp,
            deps: [AppSettingsService, Injector, CountryPickerService],
            multi: true
        },
        // Set up the app injector for loginRedirect
        {
            provide: ENVIRONMENT_INITIALIZER,
            useFactory: () => {
                const injector = inject(Injector);
                return () => setAppInjector(injector);
            },
            multi: true
        },
        // Material config
        { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
        { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { autoFocus: 'first-tabbable' } },
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { subscriptSizing: 'dynamic' } },
        // URL serializer
        { provide: UrlSerializer, useClass: LowerCaseUrlSerializer },
    ]
};
