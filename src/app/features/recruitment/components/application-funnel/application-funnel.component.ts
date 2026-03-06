import { Component, OnInit, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { first } from 'rxjs/operators';
import { MatCard } from '@angular/material/card';
import { MatTab, MatTabGroup, MatTabContent } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';
import { RecruitmentService, ApplicationFunnelResponse, FunnelData } from '../../services/recruitment.service';

@Component({
    selector: 'app-application-funnel',
    templateUrl: './application-funnel.component.html',
    styleUrls: ['./application-funnel.component.scss'],
    imports: [NgTemplateOutlet, MatCard, MatTab, MatTabGroup, MatTabContent, MatTooltip]
})
export class ApplicationFunnelComponent implements OnInit {
    private recruitmentService = inject(RecruitmentService);

    funnel: ApplicationFunnelResponse | null = null;

    ngOnInit() {
        this.recruitmentService.getFunnelStats().pipe(first()).subscribe({
            next: (response) => {
                this.funnel = response;
            }
        });
    }

    percentage(data: FunnelData, count: number): string {
        if (data.stages.infoPageViews === 0) {
            return '';
        }
        return Math.round((count / data.stages.infoPageViews) * 100) + '%';
    }

    formatDuration(seconds: number): string {
        if (seconds === 0) return '0s';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        if (minutes === 0) return `${remainingSeconds}s`;
        return `${minutes}m ${remainingSeconds}s`;
    }
}
