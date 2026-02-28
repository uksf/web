import { Routes } from '@angular/router';
import { DocsPageComponent } from './components/docs-page/docs-page.component';
import { DocsService } from './services/docs.service';

export const DOCS_ROUTES: Routes = [
    {
        path: '',
        component: DocsPageComponent,
        providers: [DocsService]
    }
];
