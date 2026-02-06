import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

// Components
import { HomePageComponent } from './components/home-page/home-page.component';

@NgModule({
    declarations: [
        HomePageComponent,
    ],
    imports: [
        SharedModule,
    ],
    exports: [
        HomePageComponent,
    ],
})
export class HomeModule {}
