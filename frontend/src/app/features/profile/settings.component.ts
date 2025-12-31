import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService, UserProfile, UserPreferences } from './profile.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private profileService = inject(ProfileService);

  profile: UserProfile | null = null;
  preferences: UserPreferences = {
    timezone: 'UTC',
    emailNotificationsEnabled: true
  };

  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Australia/Sydney', label: 'Sydney' }
  ];

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = null;

    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.profile = response.data;
        // Set preferences from user data (would need to be added to the backend response)
        this.preferences = {
          timezone: 'UTC', // Default, backend would need to return this
          emailNotificationsEnabled: true
        };
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load settings';
        this.loading = false;
      }
    });
  }

  saveSettings(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.profileService.updatePreferences(this.preferences).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.preferences = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update settings';
        this.loading = false;
      }
    });
  }
}
