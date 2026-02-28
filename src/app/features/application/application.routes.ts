import { Routes } from '@angular/router';
import { ApplicationPageComponent } from './components/application-page/application-page.component';
import { ApplicationService } from './services/application.service';

export const APPLICATION_ROUTES: Routes = [
    {
        path: '',
        component: ApplicationPageComponent,
        providers: [ApplicationService]
    }
];
