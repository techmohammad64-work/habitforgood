import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  user: {
    id: number;
    email: string;
    role: string;
  };
  profile: any;
}

export interface UserPreferences {
  timezone: string;
  emailNotificationsEnabled: boolean;
}

export interface ProfileUpdateData {
  displayName?: string;
  avatarUrl?: string;
  name?: string;
  organization?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/users';

  getProfile(): Observable<{ success: boolean; data: UserProfile }> {
    return this.http.get<{ success: boolean; data: UserProfile }>(`${this.apiUrl}/me/profile`);
  }

  updateProfile(data: ProfileUpdateData): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/me`, data);
  }

  updatePreferences(preferences: Partial<UserPreferences>): Observable<{ success: boolean; message: string; data: UserPreferences }> {
    return this.http.patch<{ success: boolean; message: string; data: UserPreferences }>(`${this.apiUrl}/me/preferences`, preferences);
  }
}
