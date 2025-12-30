import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '@env/environment';
import { ApiResponse } from '@core/services/campaign.service';

interface SponsorDashboardData {
  sponsor: {
    name: string;
    totalDonated: number;
  };
  stats: {
    activePledges: number;
    totalProjectedDonation: number;
  };
  pledges: {
    id: string;
    campaignId: string;
    status: string;
    ratePerPoint: number;
    capAmount?: number;
    totalCampaignPoints: number;
    projectedAmount: number;
    campaign: {
      title: string;
    };
  }[];
}

@Component({
  selector: 'app-sponsor-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="dashboard">
      @if (loading) {
        <div class="loading-state"><div class="spinner"></div></div>
      } @else if (data) {
        <header class="dashboard-header">
          <h1 data-test-id="sponsor-dashboard-title">Sponsor Dashboard</h1>
          <p class="text-muted">Welcome, {{ data.sponsor.name }}! Thank you for supporting healthy habits.</p>
        </header>

        <section class="stats-section" data-test-id="sponsor-stats">
          <div class="stat-card stat-donated">
            <span class="stat-icon">💰</span>
            <span class="stat-value">\${{ data.sponsor.totalDonated | number:'1.2-2' }}</span>
            <span class="stat-label">Total Donated</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📋</span>
            <span class="stat-value">{{ data.stats.activePledges }}</span>
            <span class="stat-label">Active Pledges</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">💝</span>
            <span class="stat-value">\${{ data.stats.totalProjectedDonation | number:'1.2-2' }}</span>
            <span class="stat-label">Projected Total</span>
          </div>
        </section>

        <section class="pledges-section">
          <h2>My Pledges</h2>
          @if (!data.pledges || data.pledges.length === 0) {
            <div class="empty-state card">
              <span class="empty-icon">💝</span>
              <h3>No pledges yet</h3>
              <p class="text-muted">Browse campaigns and make a pledge to support kids building healthy habits!</p>
              <a routerLink="/campaigns" class="btn btn-primary">Browse Campaigns</a>
            </div>
          } @else {
            <div class="pledges-grid" data-test-id="sponsor-pledges-list">
              @for (pledge of data.pledges; track pledge.id) {
                <div class="pledge-card card-elevated">
                  <div class="pledge-header">
                    <h3>{{ pledge.campaign.title }}</h3>
                    <span class="badge" [class]="pledge.status === 'active' ? 'badge-success' : 'badge-warning'">
                      {{ pledge.status }}
                    </span>
                  </div>
                  <div class="pledge-details">
                    <div class="detail-row">
                      <span class="detail-label">Rate per point:</span>
                      <span class="detail-value">\${{ pledge.ratePerPoint }}</span>
                    </div>
                    @if (pledge.capAmount) {
                      <div class="detail-row">
                        <span class="detail-label">Cap amount:</span>
                        <span class="detail-value">\${{ pledge.capAmount }}</span>
                      </div>
                    }
                    <div class="detail-row">
                      <span class="detail-label">Campaign points:</span>
                      <span class="detail-value">{{ pledge.totalCampaignPoints || 0 }}</span>
                    </div>
                    <div class="detail-row projected">
                      <span class="detail-label">Projected donation:</span>
                      <span class="detail-value">\${{ pledge.projectedAmount | number:'1.2-2' }}</span>
                    </div>
                  </div>
                  <a [routerLink]="['/campaigns', pledge.campaignId]" class="btn btn-outline btn-sm">View Campaign</a>
                </div>
              }
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard { max-width: var(--max-width-xl); margin: 0 auto; }
    .loading-state { text-align: center; padding: var(--spacing-3xl); }
    .dashboard-header { margin-bottom: var(--spacing-xl); }
    .dashboard-header h1 { margin-bottom: 4px; }
    .stats-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-xl); }
    .stat-card { background: var(--color-snow); padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center; box-shadow: var(--shadow-sm); }
    .stat-icon { font-size: 32px; display: block; margin-bottom: var(--spacing-sm); }
    .stat-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); display: block; }
    .stat-donated .stat-value { color: var(--color-primary); }
    .stat-label { font-size: var(--font-size-sm); color: var(--color-wolf); }
    .pledges-section h2 { margin-bottom: var(--spacing-md); }
    .pledges-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-md); }
    .pledge-card { padding: var(--spacing-lg); }
    .pledge-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-md); }
    .pledge-header h3 { font-size: var(--font-size-lg); }
    .pledge-details { margin-bottom: var(--spacing-md); }
    .detail-row { display: flex; justify-content: space-between; padding: var(--spacing-xs) 0; border-bottom: 1px solid var(--color-swan); }
    .detail-row.projected { border-bottom: none; padding-top: var(--spacing-sm); font-weight: var(--font-weight-bold); }
    .detail-label { color: var(--color-wolf); }
    .empty-state { text-align: center; padding: var(--spacing-2xl); }
    .empty-icon { font-size: 48px; display: block; margin-bottom: var(--spacing-md); }
    @media (max-width: 768px) { .stats-section { grid-template-columns: 1fr; } .pledges-grid { grid-template-columns: 1fr; } }
  `],
})
export class SponsorDashboardComponent implements OnInit {
  data: SponsorDashboardData | null = null;
  loading = true;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<ApiResponse<SponsorDashboardData>>(`${environment.apiUrl}/dashboard/sponsor`).subscribe({
      next: (res) => { if (res.success) this.data = res.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
