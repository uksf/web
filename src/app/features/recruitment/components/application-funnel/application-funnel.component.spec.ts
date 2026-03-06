import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApplicationFunnelComponent } from './application-funnel.component';
import { RecruitmentService, ApplicationFunnelResponse, FunnelData } from '../../services/recruitment.service';

describe('ApplicationFunnelComponent', () => {
    let component: ApplicationFunnelComponent;
    let mockRecruitmentService: { getFunnelStats: ReturnType<typeof vi.fn> };

    const mockFunnelData: FunnelData = {
        stages: {
            infoPageViews: 85,
            infoPageNext: 28,
            accountCreated: 18,
            emailConfirmed: 15,
            commsLinked: 12,
            applicationSubmitted: 9
        },
        avgDuration: { overall: 73, bounced: 12, proceeded: 105 }
    };

    const mockResponse: ApplicationFunnelResponse = {
        lastMonth: mockFunnelData,
        total: { ...mockFunnelData, stages: { ...mockFunnelData.stages, infoPageViews: 200 } }
    };

    beforeEach(() => {
        mockRecruitmentService = { getFunnelStats: vi.fn().mockReturnValue(of(mockResponse)) };

        TestBed.configureTestingModule({
            providers: [
                ApplicationFunnelComponent,
                { provide: RecruitmentService, useValue: mockRecruitmentService }
            ]
        });

        component = TestBed.inject(ApplicationFunnelComponent);
        component.ngOnInit();
    });

    it('should load funnel data on init', () => {
        expect(mockRecruitmentService.getFunnelStats).toHaveBeenCalled();
        expect(component.funnel).toEqual(mockResponse);
    });

    it('should calculate percentage relative to info page views for given data', () => {
        expect(component.percentage(mockFunnelData, 28)).toBe('33%');
        expect(component.percentage(mockFunnelData, 9)).toBe('11%');
    });

    it('should return empty string for percentage when no views', () => {
        const emptyData: FunnelData = { ...mockFunnelData, stages: { ...mockFunnelData.stages, infoPageViews: 0 } };
        expect(component.percentage(emptyData, 5)).toBe('');
    });

    it('should format seconds as minutes and seconds', () => {
        expect(component.formatDuration(73)).toBe('1m 13s');
        expect(component.formatDuration(12)).toBe('12s');
        expect(component.formatDuration(105)).toBe('1m 45s');
        expect(component.formatDuration(0)).toBe('0s');
    });
});
