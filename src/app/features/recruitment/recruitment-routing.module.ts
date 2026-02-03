import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecruitmentPageComponent } from './components/recruitment-page/recruitment-page.component';
import { RecruitmentApplicationPageComponent } from './components/recruitment-application-page/recruitment-application-page.component';

const routes: Routes = [
    { path: '', component: RecruitmentPageComponent },
    { path: ':id', component: RecruitmentApplicationPageComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RecruitmentRoutingModule {}
