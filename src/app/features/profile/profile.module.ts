import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { ProfileRoutingModule } from './profile-routing.module';

// Components
import { ProfilePageComponent } from './components/profile-page/profile-page.component';

// Modals
import { ChangeFirstLastModalComponent } from './modals/change-first-last-modal/change-first-last-modal.component';
import { ChangePasswordModalComponent } from './modals/change-password-modal/change-password-modal.component';
import { ConnectTeamspeakModalComponent } from './modals/connect-teamspeak-modal/connect-teamspeak-modal.component';

// Material modules
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';

@NgModule({
    declarations: [
        ProfilePageComponent,
        ChangeFirstLastModalComponent,
        ChangePasswordModalComponent,
        ConnectTeamspeakModalComponent,
    ],
    imports: [
        SharedModule,
        ProfileRoutingModule,
        MatSlideToggleModule,
    ],
})
export class ProfileModule {}
