import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { InformationRoutingModule } from './information-routing.module';

// Components
import { InformationPageComponent } from './components/information-page/information-page.component';
import { AboutPageComponent } from './components/about-page/about-page.component';
import { RulesPageComponent } from './components/rules-page/rules-page.component';
import { PolicyPageComponent } from './components/policy-page/policy-page.component';

@NgModule({
    imports: [SharedModule, InformationRoutingModule, InformationPageComponent, AboutPageComponent, RulesPageComponent, PolicyPageComponent]
})
export class InformationModule {}
