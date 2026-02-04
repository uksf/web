import { NgModule } from '@angular/core';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MatTabsModule } from '@angular/material/tabs';
import { SharedModule } from '@shared/shared.module';
import { RecruitmentRoutingModule } from './recruitment-routing.module';

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
})
export class RecruitmentModule {}
