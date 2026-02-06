import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { LiveRoutingModule } from './live-routing.module';
import { MatTabsModule } from '@angular/material/tabs';

// Components
import { LivePageComponent } from './components/live-page/live-page.component';

@NgModule({
    declarations: [
        LivePageComponent,
    ],
    imports: [
        SharedModule,
        LiveRoutingModule,
        MatTabsModule,
    ],
})
export class LiveModule {}
