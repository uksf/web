import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { ApplicationRoutingModule } from './application-routing.module';
import { ApplicationService } from './services/application.service';

// Components
import { ApplicationPageComponent } from './components/application-page/application-page.component';
import { ApplicationInfoComponent } from './components/application-info/application-info.component';
import { ApplicationIdentityComponent } from './components/application-identity/application-identity.component';
import { ApplicationEmailConfirmationComponent } from './components/application-email-confirmation/application-email-confirmation.component';
import { ApplicationCommunicationsComponent } from './components/application-communications/application-communications.component';
import { ApplicationDetailsComponent } from './components/application-details/application-details.component';
import { ApplicationSubmitComponent } from './components/application-submit/application-submit.component';
import { ApplicationEditComponent } from './components/application-edit/application-edit.component';

@NgModule({
    imports: [
        SharedModule,
        ApplicationRoutingModule,
    ],
    declarations: [
        ApplicationPageComponent,
        ApplicationInfoComponent,
        ApplicationIdentityComponent,
        ApplicationEmailConfirmationComponent,
        ApplicationCommunicationsComponent,
        ApplicationDetailsComponent,
        ApplicationSubmitComponent,
        ApplicationEditComponent,
    ],
    providers: [ApplicationService],
})
export class ApplicationModule {}
