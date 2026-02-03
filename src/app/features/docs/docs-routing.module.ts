import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocsPageComponent } from './components/docs-page/docs-page.component';

const routes: Routes = [
    {
        path: '',
        component: DocsPageComponent,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DocsRoutingModule {}
