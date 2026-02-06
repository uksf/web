import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';

// Components
import { LoginPageComponent } from './components/login-page/login-page.component';
import { LoginComponent } from './components/login/login.component';
import { RequestPasswordResetComponent } from './components/request-password-reset/request-password-reset.component';
import { PasswordResetComponent } from './components/reset-password/password-reset.component';

@NgModule({
    declarations: [
        LoginPageComponent,
        LoginComponent,
        RequestPasswordResetComponent,
        PasswordResetComponent,
    ],
    imports: [
        SharedModule,
        AuthRoutingModule,
    ],
    exports: [
        LoginPageComponent,
    ],
})
export class AuthModule {}
