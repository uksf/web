import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecruitmentService } from './recruitment.service';
import { of } from 'rxjs';
import { HttpParams } from '@angular/common/http';

describe('RecruitmentService', () => {
    let service: RecruitmentService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of(null)),
            post: vi.fn().mockReturnValue(of(null)),
        };
        service = new RecruitmentService(mockHttpClient, { apiUrl: 'http://localhost:5500' } as any);
    });

    it('getActiveApplications calls correct endpoint', () => {
        service.getActiveApplications().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/recruitment/applications/active');
    });

    it('getCompletedApplications calls correct endpoint with params', () => {
        const params = new HttpParams().set('page', '1').set('pageSize', '15');
        service.getCompletedApplications(params).subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/recruitment/applications/completed', { params });
    });

    it('getRecruiters calls correct endpoint', () => {
        service.getRecruiters().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/recruitment/recruiters');
    });

    it('getStats calls correct endpoint', () => {
        service.getStats().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/recruitment/stats');
    });

    it('getApplication calls correct endpoint', () => {
        service.getApplication('acc1').subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/recruitment/applications/acc1');
    });

    it('setRecruiter calls correct endpoint', () => {
        service.setRecruiter('acc1', 'rec1').subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/recruitment/applications/acc1/recruiter', { newRecruiter: 'rec1' });
    });

    it('updateApplicationState calls correct endpoint', () => {
        service.updateApplicationState('acc1', 'ACCEPTED').subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/recruitment/applications/acc1', { updatedState: 'ACCEPTED' });
    });

    it('getTeamspeakOnlineState calls correct endpoint', () => {
        service.getTeamspeakOnlineState('acc1').subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/teamspeak/acc1/onlineUserDetails');
    });

    it('getDiscordOnlineState calls correct endpoint', () => {
        service.getDiscordOnlineState('acc1').subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/discord/acc1/onlineUserDetails');
    });
});
