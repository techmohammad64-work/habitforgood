import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Habit } from './campaign.service';

export interface HabitSubmission {
    id: string;
    campaignId: string;
    submissionDate: string;
    rating?: 'great' | 'good' | 'okay' | 'hard';
}

export interface StreakInfo {
    current: number;
    longest: number;
}

export interface PointsInfo {
    base: number;
    streakMultiplier: number;
    bonusMultiplier: number;
    total: number;
}

export interface TodayHabitsResponse {
    habits: Habit[];
    submittedToday: boolean;
    submission?: HabitSubmission;
    streak: StreakInfo;
}

export interface SubmitResponse {
    submission: HabitSubmission;
    streak: StreakInfo;
    points: PointsInfo;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

@Injectable({
    providedIn: 'root',
})
export class HabitService {
    private apiUrl = `${environment.apiUrl}/habits`;

    constructor(private http: HttpClient) { }

    getTodayHabits(campaignId: string): Observable<ApiResponse<TodayHabitsResponse>> {
        return this.http.get<ApiResponse<TodayHabitsResponse>>(`${this.apiUrl}/${campaignId}/today`);
    }

    submitHabits(campaignId: string, rating?: string): Observable<ApiResponse<SubmitResponse>> {
        return this.http.post<ApiResponse<SubmitResponse>>(`${this.apiUrl}/${campaignId}/submit`, { rating });
    }

    getSubmissionHistory(campaignId: string, limit = 30): Observable<ApiResponse<HabitSubmission[]>> {
        return this.http.get<ApiResponse<HabitSubmission[]>>(`${this.apiUrl}/${campaignId}/history`, {
            params: { limit: limit.toString() },
        });
    }

    getStreak(campaignId: string): Observable<ApiResponse<StreakInfo>> {
        return this.http.get<ApiResponse<StreakInfo>>(`${this.apiUrl}/${campaignId}/streak`);
    }
}
