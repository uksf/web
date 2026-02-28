import { Injector } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RedirectService } from '@app/core/services/authentication/redirect.service';

/**
 * Injector reference set during app bootstrap via ENVIRONMENT_INITIALIZER.
 * Used by loginRedirect to access services in the NgxPermissionsGuard callback context,
 * where Angular's inject() function is not available.
 */
let appInjector: Injector;

export function setAppInjector(injector: Injector): void {
    appInjector = injector;
}

export function loginRedirect(rejectedPermissionName: string, activatedRouteSnapshot: ActivatedRouteSnapshot, routerStateSnapshot: RouterStateSnapshot): string {
    const redirectService = appInjector.get(RedirectService);
    redirectService.setRedirectUrl(routerStateSnapshot.url);
    return '/login';
}
