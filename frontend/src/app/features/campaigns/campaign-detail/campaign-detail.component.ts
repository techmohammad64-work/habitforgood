import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CampaignService, Campaign, ApiResponse, LeaderboardEntry } from '@core/services/campaign.service';
import { AuthService } from '@core/services/auth.service';
import { SponsorService } from '@core/services/sponsor.service';
import { NotificationService } from '@core/services/notification.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="campaign-detail">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      } @else if (!campaign) {
        <div class="error-state">
          <span class="error-emoji">😕</span>
          <h2>Campaign not found</h2>
          <a routerLink="/campaigns" class="btn btn-primary">Browse Campaigns</a>
        </div>
      } @else {
        <!-- Header -->
        <header class="campaign-header">
          <button (click)="goBack()" class="back-link" aria-label="Go back">← Back</button>
          <div class="header-content">
            <div class="header-badges">
              <span class="badge" [class]="getStatusBadgeClass(campaign.status)">
                {{ campaign.status }}
              </span>
              @if (campaign.featured) {
                <span class="badge badge-warning">⭐ Featured</span>
              }
            </div>
            <h1 data-test-id="campaign-title">{{ campaign.title }}</h1>
            <p class="campaign-description">{{ campaign.description }}</p>
          </div>
        </header>

        <div class="campaign-content">
          <!-- Main Info -->
          <div class="main-section">
            <!-- Stats -->
            <div class="stats-grid" data-test-id="campaign-stats">
              <div class="stat-card">
                <span class="stat-icon">👥</span>
                <span class="stat-value">{{ campaign.enrollmentCount || 0 }}</span>
                <span class="stat-label">Students Enrolled</span>
              </div>
              <div class="stat-card">
                <span class="stat-icon">⭐</span>
                <span class="stat-value">{{ campaign.totalPoints || 0 }}</span>
                <span class="stat-label">Total Points</span>
              </div>
              <div class="stat-card">
                <span class="stat-icon">📅</span>
                <span class="stat-value">{{ getDaysRemaining() }}</span>
                <span class="stat-label">Days Left</span>
              </div>
              <div class="stat-card">
                <span class="stat-icon">💰</span>
                <span class="stat-value">\${{ campaign.goalAmount || 0 }}</span>
                <span class="stat-label">Goal Amount</span>
              </div>
            </div>

            <!-- Habits -->
            <section class="habits-section">
              <h2>Daily Habits</h2>
              <div class="habits-list" data-test-id="campaign-habits">
                @for (habit of campaign.habits; track habit.id) {
                  <div class="habit-item" [attr.data-test-id]="'habit-item-' + habit.id">
                    <span class="habit-icon">{{ getHabitIcon(habit.icon) }}</span>
                    <div class="habit-info">
                      <h4>{{ habit.name }}</h4>
                      @if (habit.description) {
                        <p>{{ habit.description }}</p>
                      }
                    </div>
                    <span class="habit-frequency badge badge-secondary">{{ habit.frequency }}</span>
                  </div>
                }
              </div>
            </section>

            <!-- Leaderboard -->
            <section class="leaderboard-section">
              <h2>🏆 Leaderboard</h2>
              @if (leaderboard.length === 0) {
                <div class="empty-leaderboard">
                  <p>No one has earned points yet. Be the first!</p>
                </div>
              } @else {
                <div class="leaderboard" data-test-id="campaign-leaderboard">
                  @for (entry of leaderboard; track entry.rank) {
                    <div class="leaderboard-row" [attr.data-test-id]="'leaderboard-row-' + entry.rank">
                      <span class="rank" [class]="getRankClass(entry.rank)">{{ entry.rank }}</span>
                      <span class="name">{{ entry.displayName }}</span>
                      <span class="streak">🔥 {{ entry.currentStreak }} day streak</span>
                    </div>
                  }
                </div>
              }
            </section>
          </div>

          <!-- Sidebar -->
          <aside class="sidebar">
            <div class="action-card card-elevated">
              @if (authService.isAuthenticated()) {
                @if (authService.currentUser()?.role === 'student') {
                  @if (isEnrolled) {
                    <div class="enrolled-status">
                      <span class="status-icon">✅</span>
                      <span>You're enrolled!</span>
                    </div>
                    <a 
                      [routerLink]="['/student/submit', campaign.id]" 
                      class="btn btn-primary btn-lg"
                      data-test-id="submit-habits-button"
                    >
                      Submit Today's Habits
                    </a>
                    <button 
                      class="btn btn-outline" 
                      (click)="unenroll()" 
                      [disabled]="actionLoading"
                      data-test-id="unenroll-button"
                    >
                      Leave Campaign
                    </button>
                  } @else {
                    <button 
                      class="btn btn-primary btn-lg"
                      (click)="enroll()" 
                      [disabled]="actionLoading || campaign.status !== 'active'"
                      data-test-id="campaign-enroll-button"
                    >
                      @if (actionLoading) {
                        <span class="spinner spinner-sm"></span>
                      } @else {
                        Join Campaign
                      }
                    </button>
                    @if (campaign.status !== 'active') {
                      <p class="text-muted text-center">Campaign is not active yet</p>
                    }
                  }
                } @else if (authService.currentUser()?.role === 'admin') {
                  <div class="admin-actions">
                    <p class="text-muted text-center mb-sm">You are viewing as Admin</p>
                    <a 
                       [routerLink]="['/admin/campaigns', campaign.id, 'edit']" 
                       class="btn btn-secondary btn-lg"
                       data-test-id="edit-campaign-button"
                    >
                       ✏️ Edit Campaign
                    </a>
                  </div>
                } @else if (authService.currentUser()?.role === 'sponsor') {
                  <div class="sponsor-actions">
                    @if (pledgeSuccess) {
                      <div class="success-message">
                        <span class="check-icon">✅</span>
                        <h3>Thank you for your pledge!</h3>
                        <p>Your support helps students build better habits.</p>
                      </div>
                    } @else {
                      <h3>Sponsor this Campaign</h3>
                      <p class="text-muted mb-md">Pledge a donation for every point students earn.</p>
                      
                      <form [formGroup]="pledgeForm" (ngSubmit)="onPledge()">
                        <div class="form-group mb-sm">
                          <label class="form-label" for="ratePerPoint">Rate per Point ($)</label>
                          <input id="ratePerPoint" type="number" step="0.01" class="form-input" formControlName="ratePerPoint" placeholder="0.10">
                        </div>
                        <div class="form-group mb-md">
                          <label class="form-label" for="capAmount">Maximum Cap ($) <small>(Optional)</small></label>
                          <input id="capAmount" type="number" step="10" class="form-input" formControlName="capAmount" placeholder="1000">
                        </div>

                        <div class="form-group mb-sm">
                          <label class="form-label" for="pledgeMessage">Inspiring Message <small>(Optional)</small></label>
                          <textarea id="pledgeMessage" class="form-input" formControlName="message" rows="2" placeholder="Great job students! From: Local Business"></textarea>
                        </div>
                        
                        <div class="form-group mb-md">
                          <label class="form-label" for="adImageUrl">Ad Image URL <small>(Optional)</small></label>
                          <input id="adImageUrl" type="text" class="form-input" formControlName="adImageUrl" placeholder="https://example.com/logo.png">
                        </div>

                        <button type="submit" class="btn btn-primary btn-lg" [disabled]="pledgeForm.invalid || actionLoading">
                          @if (actionLoading) {
                            <span class="spinner spinner-sm"></span>
                          } @else {
                            ❤️ Pledge Donation
                          }
                        </button>
                      </form>
                    }
                  </div>
                }
              } @else {
                <p class="login-prompt">
                  <a routerLink="/login">Log in</a> or 
                  <a routerLink="/register">create an account</a> to join!
                </p>
              }
            </div>

            @if (campaign.admin) {
              <div class="info-card card">
                <h4>Organized by</h4>
                <p class="organizer-name">{{ campaign.admin.name }}</p>
                @if (campaign.admin.organization) {
                  <p class="organizer-org text-muted">{{ campaign.admin.organization }}</p>
                }
              </div>
            }

            @if (campaign.categoryTags && campaign.categoryTags.length > 0) {
              <div class="info-card card">
                <h4>Categories</h4>
                <div class="tags">
                  @for (tag of campaign.categoryTags; track tag) {
                    <span class="tag">{{ tag }}</span>
                  }
                </div>
              </div>
            }

            <!-- Sponsor Details (Admin Only) -->
            @if (authService.currentUser()?.role === 'admin' && campaign.sponsors && campaign.sponsors.length > 0) {
              <div class="info-card card sponsors-card">
                <h4>❤️ Campaign Sponsors</h4>
                <div class="sponsors-list">
                  @for (sponsor of campaign.sponsors; track sponsor.email) {
                    <div class="sponsor-item">
                      <div class="sponsor-header">
                        <span class="sponsor-name">{{ sponsor.name }}</span>
                        <span class="badge" [class]="sponsor.status === 'active' ? 'badge-success' : 'badge-warning'">
                          {{ sponsor.status }}
                        </span>
                      </div>
                      <p class="sponsor-email">{{ sponsor.email }}</p>
                      
                      <div class="pledge-stats">
                        <span class="stat">\${{ sponsor.ratePerPoint }}/pt</span>
                        <span class="divider">|</span>
                        <span class="stat">Cap: {{ sponsor.capAmount ? '$' + sponsor.capAmount : 'None' }}</span>
                      </div>

                      @if (sponsor.message) {
                        <div class="ad-mini-preview">
                          <span class="ad-label">AD:</span> "{{ sponsor.message }}"
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .campaign-detail {
      max-width: var(--max-width-xl);
      margin: 0 auto;
    }
    
    .loading-state, .error-state {
      text-align: center;
      padding: var(--spacing-3xl);
    }
    
    .error-emoji {
      font-size: 64px;
      display: block;
      margin-bottom: var(--spacing-md);
    }
    
    .back-link {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      color: var(--color-wolf);
      cursor: pointer;
      display: inline-block;
      margin-bottom: var(--spacing-md);
      transition: color var(--transition-fast);
      text-decoration: none;
    }
    
    .back-link:hover {
      color: var(--color-primary);
    }
    
    .campaign-header {
      margin-bottom: var(--spacing-xl);
    }
    
    .header-badges {
      display: flex;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    
    .campaign-header h1 {
      font-size: var(--font-size-3xl);
      margin-bottom: var(--spacing-md);
    }
    
    .campaign-description {
      font-size: var(--font-size-lg);
      color: var(--color-wolf);
      max-width: 700px;
    }
    
    .campaign-content {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: var(--spacing-xl);
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }
    
    .stat-card {
      background: var(--color-snow);
      padding: var(--spacing-md);
      border-radius: var(--radius-lg);
      text-align: center;
      box-shadow: var(--shadow-sm);
    }
    
    .stat-icon {
      font-size: 28px;
      display: block;
      margin-bottom: var(--spacing-xs);
    }
    
    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      display: block;
      color: var(--color-primary);
    }
    
    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--color-wolf);
    }
    
    .habits-section, .leaderboard-section {
      background: var(--color-snow);
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      margin-bottom: var(--spacing-lg);
      box-shadow: var(--shadow-sm);
    }
    
    .habits-section h2, .leaderboard-section h2 {
      margin-bottom: var(--spacing-md);
    }
    
    .habit-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--color-swan);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-sm);
    }
    
    .habit-icon {
      font-size: 28px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-snow);
      border-radius: var(--radius-circle);
    }
    
    .habit-info {
      flex: 1;
    }
    
    .habit-info h4 {
      margin-bottom: 4px;
    }
    
    .habit-info p {
      font-size: var(--font-size-sm);
      color: var(--color-wolf);
      margin: 0;
    }
    
    .leaderboard-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--color-swan);
    }
    
    .rank {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-circle);
      font-weight: var(--font-weight-bold);
      background: var(--color-swan);
    }
    
    .rank.gold { background: var(--color-bee); }
    .rank.silver { background: #C0C0C0; }
    .rank.bronze { background: #CD7F32; color: white; }
    
    .name { flex: 1; font-weight: var(--font-weight-semibold); }
    .streak { color: var(--color-wolf); font-size: var(--font-size-sm); }
    
    .action-card {
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-md);
    }
    
    .action-card .btn {
      width: 100%;
      margin-bottom: var(--spacing-sm);
    }
    
    .enrolled-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: var(--color-mint);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-eel);
    }
    
    .status-icon { font-size: 20px; }
    
    .login-prompt {
      text-align: center;
      color: var(--color-wolf);
    }
    
    .info-card {
      margin-bottom: var(--spacing-md);
      padding: var(--spacing-md);
    }
    
    .info-card h4 {
      font-size: var(--font-size-sm);
      color: var(--color-wolf);
      margin-bottom: var(--spacing-xs);
    }
    
    .organizer-name {
      font-weight: var(--font-weight-semibold);
      margin-bottom: 0;
    }
    
    .organizer-org {
      margin: 0;
    }
    
    .tags {
      display: flex;
      gap: var(--spacing-xs);
      flex-wrap: wrap;
    }
    
    .tag {
      padding: 4px 10px;
      background: var(--color-swan);
      border-radius: var(--radius-pill);
      font-size: var(--font-size-xs);
    }
    
    @media (max-width: 1024px) {
      .campaign-content {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .sponsors-card {
      border: 1px solid var(--color-hare);
    }

    .sponsor-item {
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--color-swan);
      
      &:last-child { border-bottom: none; }
    }

    .sponsor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }

    .sponsor-name { font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm); }
    .sponsor-email { color: var(--color-wolf); font-size: var(--font-size-xs); margin: 0 0 4px 0; }
    
    .pledge-stats {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--font-size-xs);
      color: var(--color-eel);
      margin-bottom: 4px;
    }
    
    .ad-mini-preview {
      font-size: var(--font-size-xs);
      font-style: italic;
      color: var(--color-wolf);
      background: var(--color-swan);
      padding: 4px;
      border-radius: var(--radius-sm);
    }
    .ad-label { font-weight: bold; font-style: normal; font-size: 9px; text-transform: uppercase; }
    
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .sponsors-section {
      background: var(--color-snow);
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      margin-top: var(--spacing-lg);
      border: 1px solid var(--color-hare);
    }

    .sponsors-list {
      display: grid;
      gap: var(--spacing-md);
    }

    .sponsor-card {
      background: white;
      padding: var(--spacing-lg);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-hare);
    }

    .sponsor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);
    }

    .sponsor-header h3 { margin: 0; font-size: var(--font-size-md); }
    
    .sponsor-email { color: var(--color-wolf); font-size: var(--font-size-sm); margin: 0 0 var(--spacing-md) 0; }

    .pledge-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
      padding: var(--spacing-sm);
      background: var(--color-snow);
      border-radius: var(--radius-sm);
    }

    .pledge-item { display: flex; flex-direction: column; }
    .pledge-item .label { font-size: var(--font-size-xs); color: var(--color-wolf); }
    .pledge-item .value { font-weight: var(--font-weight-bold); font-size: var(--font-size-sm); }

    .ad-preview {
      border-top: 1px dashed var(--color-hare);
      padding-top: var(--spacing-sm);
      font-size: var(--font-size-sm);
    }

    .ad-preview strong { display: block; margin-bottom: 4px; color: var(--color-wolf); font-size: var(--font-size-xs); text-transform: uppercase; }
    .ad-message { margin: 0 0 var(--spacing-sm) 0; font-style: italic; color: var(--color-eel); }
    .ad-image-preview { max-height: 80px; border-radius: var(--radius-sm); }
  `],
})
export class CampaignDetailComponent implements OnInit {
  campaign: Campaign | null = null;
  leaderboard: LeaderboardEntry[] = [];
  loading = true;
  actionLoading = false;
  isEnrolled = false;
  pledgeForm: FormGroup;
  pledgeSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    public authService: AuthService,
    private fb: FormBuilder,
    private sponsorService: SponsorService,
    private notificationService: NotificationService,
    private location: Location
  ) {
    this.pledgeForm = this.fb.group({
      ratePerPoint: ['', [Validators.required, Validators.min(0.01)]],
      capAmount: [''],
      message: ['', [Validators.maxLength(200)]],
      adImageUrl: ['']
    });
  }

  goBack(): void {
    const user = this.authService.currentUser();

    // If we have history, just go back (best for most cases)
    if (window.history.length > 2) { // 2 because the initial page is also in history
      this.location.back();
      return;
    }

    // Fallback based on role
    if (user) {
      switch (user.role) {
        case 'admin':
          this.router.navigate(['/admin/dashboard']);
          break;
        case 'student':
          this.router.navigate(['/student/dashboard']);
          break;
        case 'sponsor':
          this.router.navigate(['/sponsor/dashboard']);
          break;
        default:
          this.router.navigate(['/campaigns']);
      }
    } else {
      this.router.navigate(['/campaigns']);
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCampaign(id);
      this.loadLeaderboard(id);
    }
  }

  onPledge(): void {
    if (this.pledgeForm.invalid || !this.campaign) return;

    this.actionLoading = true;
    this.sponsorService.createPledge({
      campaignId: this.campaign.id,
      ratePerPoint: this.pledgeForm.value.ratePerPoint,
      capAmount: this.pledgeForm.value.capAmount || undefined,
      message: this.pledgeForm.value.message || undefined,
      adImageUrl: this.pledgeForm.value.adImageUrl || undefined
    }).subscribe({
      next: () => {
        this.actionLoading = false;
        this.pledgeSuccess = true;
        this.pledgeForm.reset();
        this.notificationService.success('Pledge successfully created! Thank you for your support.');
      },
      error: () => {
        this.actionLoading = false;
        // Error handled globally
      }
    });
  }

  loadCampaign(id: string): void {
    this.campaignService.getCampaignById(id).subscribe({
      next: (res: ApiResponse<Campaign>) => {
        if (res.success) {
          this.campaign = res.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadLeaderboard(id: string): void {
    this.campaignService.getLeaderboard(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaderboard = response.data;
        }
      },
    });
  }

  enroll(): void {
    if (!this.campaign) return;
    this.actionLoading = true;

    this.campaignService.enrollInCampaign(this.campaign.id).subscribe({
      next: () => {
        this.isEnrolled = true;
        this.actionLoading = false;
        if (this.campaign) {
          this.campaign.enrollmentCount = (this.campaign.enrollmentCount || 0) + 1;
        }
      },
      error: () => {
        this.actionLoading = false;
      },
    });
  }

  unenroll(): void {
    if (!this.campaign) return;
    this.actionLoading = true;

    this.campaignService.unenrollFromCampaign(this.campaign.id).subscribe({
      next: () => {
        this.isEnrolled = false;
        this.actionLoading = false;
        if (this.campaign) {
          this.campaign.enrollmentCount = Math.max(0, (this.campaign.enrollmentCount || 1) - 1);
        }
      },
      error: () => {
        this.actionLoading = false;
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'badge badge-success';
      case 'upcoming': return 'badge badge-secondary';
      case 'ended': return 'badge badge-warning';
      default: return 'badge';
    }
  }

  getDaysRemaining(): number {
    if (!this.campaign) return 0;
    const end = new Date(this.campaign.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  }

  getHabitIcon(icon: string): string {
    const icons: Record<string, string> = {
      water: '💧',
      book: '📚',
      sleep: '😴',
      exercise: '🏃',
      brushing: '🦷',
      fruit: '🍎',
      star: '⭐',
      default: '✅',
    };
    return icons[icon] || icons['default'];
  }
}
