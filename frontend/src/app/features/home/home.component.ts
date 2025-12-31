import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CampaignService, Campaign } from '@core/services/campaign.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="home-page">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title" data-test-id="hero-title">
            Build Healthy Habits.<br>
            <span class="text-primary">Help Others.</span>
          </h1>
          <p class="hero-subtitle">
            Kids earn points by completing daily habits. Sponsors donate to causes based on those points. Everyone wins! 🎉
          </p>
          <div class="hero-actions">
            @if (authService.isAuthenticated()) {
              <a [routerLink]="getDashboardRoute()" class="btn btn-primary btn-lg" data-test-id="hero-cta-button">
                Go to My Dashboard
              </a>
              <a routerLink="/campaigns" class="btn btn-outline btn-lg" data-test-id="hero-browse-button">
                Browse Campaigns
              </a>
            } @else {
              <a routerLink="/register" class="btn btn-primary btn-lg" data-test-id="hero-cta-button">
                Start Your Journey
              </a>
              <a routerLink="/campaigns" class="btn btn-outline btn-lg" data-test-id="hero-browse-button">
                Browse Campaigns
              </a>
            }
          </div>
        </div>
        <div class="hero-illustration">
          <div class="illustration-circle">
            <span class="illustration-emoji">🌟</span>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="how-it-works">
        <h2 class="section-title">How It Works</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-icon step-icon-green">📝</div>
            <h3>1. Join a Campaign</h3>
            <p>Pick a cause you care about and join their habit campaign</p>
          </div>
          <div class="step-card">
            <div class="step-icon step-icon-blue">✅</div>
            <h3>2. Complete Habits</h3>
            <p>Check off your healthy habits each day and build streaks</p>
          </div>
          <div class="step-card">
            <div class="step-icon step-icon-yellow">⭐</div>
            <h3>3. Earn Points</h3>
            <p>Get points for every habit completed. Longer streaks = more points!</p>
          </div>
          <div class="step-card">
            <div class="step-icon step-icon-purple">💝</div>
            <h3>4. Make an Impact</h3>
            <p>Sponsors donate based on your points. Your habits help others!</p>
          </div>
        </div>
      </section>

      <!-- Featured Campaigns -->
      <section class="featured-campaigns">
        <h2 class="section-title">Featured Campaigns</h2>
        @if (loading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading campaigns...</p>
          </div>
        } @else if (campaigns.length === 0) {
          <div class="empty-state">
            <span class="empty-emoji">🏕️</span>
            <p>No campaigns yet. Check back soon!</p>
          </div>
        } @else {
          <div class="campaigns-grid">
            @for (campaign of campaigns; track campaign.id) {
              <div class="campaign-card card-elevated" [attr.data-test-id]="'campaign-card-' + campaign.id">
                <div class="campaign-header">
                  <span class="campaign-status badge badge-success">{{ campaign.status }}</span>
                </div>
                <h3 class="campaign-title">{{ campaign.title }}</h3>
                <p class="campaign-description">{{ campaign.description | slice:0:100 }}...</p>
                <div class="campaign-stats">
                  <span class="stat">📅 {{ getDaysRemaining(campaign.endDate) }} days left</span>
                  <span class="stat">👥 {{ campaign.enrollmentCount || 0 }} enrolled</span>
                </div>
                <a [routerLink]="['/campaigns', campaign.id]" class="btn btn-primary" data-test-id="campaign-view-button">
                  View Campaign
                </a>
              </div>
            }
          </div>
        }
        <div class="view-all">
          <a routerLink="/campaigns" class="btn btn-outline" data-test-id="view-all-campaigns-button">
            View All Campaigns
          </a>
        </div>
      </section>

      <!-- Footer Transparency -->
      <footer class="footer">
        <div class="transparency-badges">
          <div class="badge-item">🔒 We do not sell your data</div>
          <div class="badge-item">🚫 No third-party ads</div>
          <div class="badge-item">💯 100% of donations go to causes</div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .home-page {
      max-width: var(--max-width-xl);
      margin: 0 auto;
    }
    
    /* Hero Section */
    .hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-3xl) 0;
      gap: var(--spacing-xl);
    }
    
    .hero-content {
      flex: 1;
    }
    
    .hero-title {
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-extrabold);
      line-height: 1.1;
      margin-bottom: var(--spacing-md);
    }
    
    .hero-subtitle {
      font-size: var(--font-size-lg);
      color: var(--color-wolf);
      margin-bottom: var(--spacing-lg);
      max-width: 500px;
    }
    
    .hero-actions {
      display: flex;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }
    
    .hero-illustration {
      flex-shrink: 0;
    }
    
    .illustration-circle {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, var(--color-mint) 0%, var(--color-primary) 100%);
      border-radius: var(--radius-circle);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: bounce 2s ease-in-out infinite;
    }
    
    .illustration-emoji {
      font-size: 120px;
    }
    
    /* How It Works */
    .how-it-works {
      padding: var(--spacing-3xl) 0;
      text-align: center;
    }
    
    .section-title {
      font-size: var(--font-size-2xl);
      margin-bottom: var(--spacing-xl);
    }
    
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-lg);
    }
    
    .step-card {
      background: var(--color-snow);
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      text-align: center;
    }
    
    .step-icon {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-circle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto var(--spacing-md);
    }
    
    .step-icon-green { background: var(--color-mint); }
    .step-icon-blue { background: var(--color-sky); }
    .step-icon-yellow { background: var(--color-bee); }
    .step-icon-purple { background: var(--color-beetle); }
    
    .step-card h3 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-sm);
    }
    
    .step-card p {
      color: var(--color-wolf);
      font-size: var(--font-size-sm);
    }
    
    /* Featured Campaigns */
    .featured-campaigns {
      padding: var(--spacing-3xl) 0;
    }
    
    .campaigns-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }
    
    .campaign-card {
      padding: var(--spacing-lg);
    }
    
    .campaign-header {
      margin-bottom: var(--spacing-sm);
    }
    
    .campaign-title {
      font-size: var(--font-size-xl);
      margin-bottom: var(--spacing-sm);
    }
    
    .campaign-description {
      color: var(--color-wolf);
      font-size: var(--font-size-sm);
      margin-bottom: var(--spacing-md);
    }
    
    .campaign-stats {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      font-size: var(--font-size-sm);
      color: var(--color-wolf);
    }
    
    .view-all {
      text-align: center;
    }
    
    .loading-state, .empty-state {
      text-align: center;
      padding: var(--spacing-3xl);
    }
    
    .empty-emoji {
      font-size: 64px;
      display: block;
      margin-bottom: var(--spacing-md);
    }
    
    /* Footer */
    .footer {
      padding: var(--spacing-xl) 0;
      border-top: 1px solid var(--color-hare);
      margin-top: var(--spacing-xl);
    }
    
    .transparency-badges {
      display: flex;
      justify-content: center;
      gap: var(--spacing-xl);
      flex-wrap: wrap;
    }
    
    .badge-item {
      font-size: var(--font-size-sm);
      color: var(--color-wolf);
    }
    
    @media (max-width: 1024px) {
      .steps-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .campaigns-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .hero {
        flex-direction: column;
        text-align: center;
      }
      
      .hero-title {
        font-size: var(--font-size-2xl);
      }
      
      .hero-subtitle {
        margin: 0 auto var(--spacing-lg);
      }
      
      .hero-actions {
        justify-content: center;
      }
      
      .illustration-circle {
        width: 200px;
        height: 200px;
      }
      
      .illustration-emoji {
        font-size: 80px;
      }
      
      .steps-grid, .campaigns-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class HomeComponent {
  campaigns: Campaign[] = [];
  loading = true;
  authService = inject(AuthService);
  private router = inject(Router);

  constructor(private campaignService: CampaignService) {
    this.loadFeaturedCampaigns();
  }

  getDashboardRoute(): string {
    const role = this.authService.currentUser()?.role;
    switch (role) {
      case 'student': return '/student/dashboard';
      case 'admin': return '/admin/dashboard';
      case 'sponsor': return '/sponsor/dashboard';
      default: return '/campaigns';
    }
  }

  loadFeaturedCampaigns(): void {
    this.campaignService.getFeaturedCampaigns().subscribe({
      next: (response) => {
        if (response.success) {
          this.campaigns = response.data.slice(0, 3);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
