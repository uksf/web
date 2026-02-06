import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InformationPageComponent } from './components/information-page/information-page.component';
import { AboutPageComponent } from './components/about-page/about-page.component';
import { RulesPageComponent } from './components/rules-page/rules-page.component';
import { PolicyPageComponent } from './components/policy-page/policy-page.component';

const routes: Routes = [
    { path: '', component: InformationPageComponent },
    { path: 'about', component: AboutPageComponent },
    { path: 'rules', component: RulesPageComponent },
    { path: 'policy', component: PolicyPageComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InformationRoutingModule {}
