import { Component, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';
import { ApplicationAnalyticsService } from '../../services/application-analytics.service';

@Component({
    selector: 'app-application-info',
    templateUrl: './application-info.component.html',
    styleUrls: ['../application-page/application-page.component.scss', './application-info.component.scss'],
    imports: [MatCard, ButtonComponent]
})
export class ApplicationInfoComponent implements OnInit, OnDestroy {
    private analytics = inject(ApplicationAnalyticsService);

    @Output() nextEvent = new EventEmitter();

    private startTime: number;
    private durationTracked = false;

    ngOnInit() {
        this.startTime = Date.now();
        this.analytics.trackEvent('info_page_view');
    }

    ngOnDestroy() {
        if (!this.durationTracked) {
            this.trackDuration();
        }
    }

    next() {
        this.trackDuration();
        this.analytics.trackEvent('info_page_next');
        this.nextEvent.emit();
    }

    private trackDuration() {
        if (this.durationTracked) return;
        this.durationTracked = true;
        const seconds = Math.round((Date.now() - this.startTime) / 1000);
        this.analytics.trackEvent('info_page_duration', seconds);
    }
}
