import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { DocsRoutingModule } from './docs-routing.module';
import { DocsService } from './services/docs.service';
import { DocsPageComponent } from './components/docs-page/docs-page.component';
import { DocsSidebarComponent } from './components/docs-sidebar/docs-sidebar.component';
import { DocsFolderComponent } from './components/docs-sidebar/docs-folder/docs-folder.component';
import { DocsDocumentComponent } from './components/docs-sidebar/docs-document/docs-document.component';
import { DocsContentComponent } from './components/docs-content/docs-content.component';
import { DocsPermissionsComponent } from './components/docs-permissions/docs-permissions.component';
import { CreateDocumentModalComponent } from './modals/create-document-modal/create-document-modal.component';
import { CreateFolderModalComponent } from './modals/create-folder-modal/create-folder-modal.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatDividerModule } from '@angular/material/divider';
import { QuillModule } from 'ngx-quill';

@NgModule({
    declarations: [
        DocsPageComponent,
        DocsSidebarComponent,
        DocsFolderComponent,
        DocsDocumentComponent,
        DocsContentComponent,
        DocsPermissionsComponent,
        CreateDocumentModalComponent,
        CreateFolderModalComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        DocsRoutingModule,
        MatExpansionModule,
        MatTabsModule,
        MatTableModule,
        MatDividerModule,
        QuillModule,
    ],
    providers: [DocsService],
})
export class DocsModule {}
