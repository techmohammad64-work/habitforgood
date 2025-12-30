import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface Campaign {
    id: string;
    title: string;
    description: string;
    categoryTags: string[];
    goalAmount: number;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'active' | 'ended' | 'completed' | 'paused';
    imageUrl?: string;
    featured: boolean;
    habits: Habit[];
    enrollmentCount?: number;
    totalPoints?: number;
    admin?: {
        name: string;
        organization?: string;
    };
    isSponsored?: boolean;
    sponsors?: {
        name: string;
        email: string;
        ratePerPoint: number;
        capAmount?: number;
        message?: string;
        adImageUrl?: string;
        status: string;
        totalDonated: number;
    }[];
}

export interface Habit {
    id: string;
    name: string;
    description?: string;
    icon: string;
    frequency: 'daily' | 'weekly';
}

export interface LeaderboardEntry {
    displayName: string;
    points: number;
    rank: number;
    currentStreak: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

@Injectable({
    providedIn: 'root',
})
export class CampaignService {
    private apiUrl = `${environment.apiUrl}/campaigns`;

    constructor(private http: HttpClient) { }

    getAllCampaigns(filters?: {
        status?: string;
        category?: string;
        featured?: boolean;
    }): Observable<ApiResponse<Campaign[]>> {
        const params: Record<string, string> = {};
        if (filters?.status) params['status'] = filters.status;
        if (filters?.category) params['category'] = filters.category;
        if (filters?.featured) params['featured'] = 'true';

        return this.http.get<ApiResponse<Campaign[]>>(this.apiUrl, { params });
    }

    getFeaturedCampaigns(): Observable<ApiResponse<Campaign[]>> {
        return this.http.get<ApiResponse<Campaign[]>>(`${this.apiUrl}/featured`);
    }

    getCampaignById(id: string): Observable<ApiResponse<Campaign>> {
        return this.http.get<ApiResponse<Campaign>>(`${this.apiUrl}/${id}`);
    }

    getLeaderboard(campaignId: string): Observable<ApiResponse<LeaderboardEntry[]>> {
        return this.http.get<ApiResponse<LeaderboardEntry[]>>(`${this.apiUrl}/${campaignId}/leaderboard`);
    }

    enrollInCampaign(campaignId: string): Observable<ApiResponse<{ enrollmentId: string }>> {
        return this.http.post<ApiResponse<{ enrollmentId: string }>>(`${this.apiUrl}/${campaignId}/enroll`, {});
    }

    unenrollFromCampaign(campaignId: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${campaignId}/enroll`);
    }

    createCampaign(data: Partial<Campaign> & { habits?: Partial<Habit>[] }): Observable<ApiResponse<Campaign>> {
        return this.http.post<ApiResponse<Campaign>>(this.apiUrl, data);
    }

    updateCampaign(id: string, data: Partial<Campaign>): Observable<ApiResponse<Campaign>> {
        return this.http.put<ApiResponse<Campaign>>(`${this.apiUrl}/${id}`, data);
    }

    pauseCampaign(id: string): Observable<ApiResponse<Campaign>> {
        return this.http.post<ApiResponse<Campaign>>(`${this.apiUrl}/${id}/pause`, {});
    }

    resumeCampaign(id: string): Observable<ApiResponse<Campaign>> {
        return this.http.post<ApiResponse<Campaign>>(`${this.apiUrl}/${id}/resume`, {});
    }

    deleteCampaign(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
    }

    addHabit(campaignId: string, habit: Partial<Habit>): Observable<ApiResponse<Habit>> {
        return this.http.post<ApiResponse<Habit>>(`${this.apiUrl}/${campaignId}/habits`, habit);
    }

    updateHabit(campaignId: string, habitId: string, habit: Partial<Habit>): Observable<ApiResponse<Habit>> {
        return this.http.put<ApiResponse<Habit>>(`${this.apiUrl}/${campaignId}/habits/${habitId}`, habit);
    }

    deleteHabit(campaignId: string, habitId: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${campaignId}/habits/${habitId}`);
    }

    getActiveAd(campaignId: string): Observable<ApiResponse<{ sponsorName: string; message: string; adImageUrl: string } | null>> {
        return this.http.get<ApiResponse<{ sponsorName: string; message: string; adImageUrl: string } | null>>(`${this.apiUrl}/${campaignId}/ad`);
    }

    triggerCampaignEmails(campaignId: string): Observable<ApiResponse<{ total: number; success: number; failed: number }>> {
        return this.http.post<ApiResponse<{ total: number; success: number; failed: number }>>(`${this.apiUrl}/${campaignId}/trigger-emails`, {});
    }
}
