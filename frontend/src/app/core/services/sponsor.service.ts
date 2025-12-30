import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface PledgeRequest {
    campaignId: string;
    ratePerPoint: number;
    capAmount?: number;
    message?: string;
    adImageUrl?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SponsorService {
    private apiUrl = `${environment.apiUrl}/sponsors`;

    constructor(private http: HttpClient) { }

    createPledge(data: PledgeRequest): Observable<ApiResponse<{ pledgeId: string }>> {
        return this.http.post<ApiResponse<{ pledgeId: string }>>(`${this.apiUrl}/pledge`, data);
    }
}
