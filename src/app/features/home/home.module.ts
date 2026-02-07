import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { HomeService } from './services/home.service';

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
    providers: [HomeService],
})
export class HomeModule {}
