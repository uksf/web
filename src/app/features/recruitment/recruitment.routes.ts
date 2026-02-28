import { Routes } from '@angular/router';
import { RecruitmentPageComponent } from './components/recruitment-page/recruitment-page.component';
import { RecruitmentApplicationPageComponent } from './components/recruitment-application-page/recruitment-application-page.component';
import { RecruitmentService } from './services/recruitment.service';

export const RECRUITMENT_ROUTES: Routes = [
    {
        path: '',
        providers: [RecruitmentService],
        children: [
            { path: '', component: RecruitmentPageComponent },
            { path: ':id', component: RecruitmentApplicationPageComponent }
        ]
    }
];
