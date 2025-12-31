import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService, UserProfile, ProfileUpdateData } from './profile.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  profile: UserProfile | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  editMode = false;

  // Form data
  formData: ProfileUpdateData = {};

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = null;

    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.profile = response.data;
        this.initializeFormData();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  initializeFormData(): void {
    if (!this.profile) return;

    const profileData = this.profile.profile;
    this.formData = {
      displayName: profileData?.displayName || profileData?.name || '',
      avatarUrl: profileData?.avatarUrl || '',
      organization: profileData?.organization || ''
    };
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.initializeFormData();
      this.successMessage = null;
    }
  }

  saveProfile(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const updateData: ProfileUpdateData = {};
    
    if (this.profile?.user.role === 'student') {
      updateData.displayName = this.formData.displayName;
      updateData.avatarUrl = this.formData.avatarUrl;
    } else if (this.profile?.user.role === 'admin') {
      updateData.name = this.formData.displayName;
      updateData.organization = this.formData.organization;
    } else if (this.profile?.user.role === 'sponsor') {
      updateData.name = this.formData.displayName;
    }

    this.profileService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loading = false;
        this.editMode = false;
        this.loadProfile();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update profile';
        this.loading = false;
      }
    });
  }

  getDisplayName(): string {
    if (!this.profile?.profile) return 'User';
    return this.profile.profile.displayName || this.profile.profile.name || 'User';
  }

  getInitials(): string {
    const name = this.getDisplayName();
    return name.charAt(0).toUpperCase();
  }
}
