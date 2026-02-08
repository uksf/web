import { NgModule } from '@angular/core';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { SharedModule } from '@shared/shared.module';
import { RecruitmentRoutingModule } from './recruitment-routing.module';
import { RecruitmentService } from './services/recruitment.service';

// Components
import { RecruitmentPageComponent } from './components/recruitment-page/recruitment-page.component';
import { RecruitmentApplicationPageComponent } from './components/recruitment-application-page/recruitment-application-page.component';

@NgModule({
    imports: [
        SharedModule,
        RecruitmentRoutingModule,
        NgxPermissionsModule.forChild(),
        MatTabsModule,
    ],
    declarations: [
        RecruitmentPageComponent,
        RecruitmentApplicationPageComponent,
    ],
    providers: [RecruitmentService],
})
export class RecruitmentModule {}
