import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { ModpackRoutingModule } from './modpack-routing.module';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MarkdownModule } from 'ngx-markdown';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';

// Components
import { ModpackPageComponent } from './modpack-page/modpack-page.component';
import { ModpackGuideComponent } from './modpack-guide/modpack-guide.component';
import { ModpackReleasesComponent } from './modpack-releases/modpack-releases.component';
import { ModpackBuildsDevComponent } from './modpack-builds-dev/modpack-builds-dev.component';
import { ModpackBuildsRcComponent } from './modpack-builds-rc/modpack-builds-rc.component';
import { ModpackBuildsStepsComponent } from './modpack-builds-steps/modpack-builds-steps.component';
import { ModpackWorkshopComponent } from './modpack-workshop/modpack-workshop.component';

// Modals
import { NewModpackBuildModalComponent } from './new-modpack-build-modal/new-modpack-build-modal.component';
import { NewModpackReleaseModalComponent } from './new-modpack-release-modal/new-modpack-release-modal.component';
import { InstallWorkshopModModalComponent } from './install-workshop-mod-modal/install-workshop-mod-modal.component';
import { WorkshopModInterventionModalComponent } from './workshop-mod-intervention-modal/workshop-mod-intervention-modal.component';
import { WorkshopService } from './services/workshop.service';

@NgModule({
    imports: [
        SharedModule,
        ModpackRoutingModule,
        NgxPermissionsModule.forChild(),
        MarkdownModule.forChild(),
        MatRadioModule,
        MatTabsModule,
    ],
    declarations: [
        ModpackPageComponent,
        ModpackGuideComponent,
        ModpackReleasesComponent,
        ModpackBuildsDevComponent,
        ModpackBuildsRcComponent,
        ModpackBuildsStepsComponent,
        ModpackWorkshopComponent,
        NewModpackBuildModalComponent,
        NewModpackReleaseModalComponent,
        InstallWorkshopModModalComponent,
        WorkshopModInterventionModalComponent,
    ],
    providers: [WorkshopService],
})
export class ModpackModule {}
