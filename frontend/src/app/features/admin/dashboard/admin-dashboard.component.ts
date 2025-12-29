import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { CampaignService } from '@core/services/campaign.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dashboard">
      @if (loading) {
        <div class="loading-state"><div class="spinner"></div></div>
      } @else if (data) {
        <header class="dashboard-header">
          <div class="header-content">
            <h1 data-test-id="admin-dashboard-title">Admin Dashboard</h1>
            <p class="text-muted">Welcome back, {{ data.admin.name }}</p>
          </div>
          <a routerLink="/admin/campaigns/create" class="btn btn-primary" data-test-id="admin-create-campaign-button">
            + Create Campaign
          </a>
        </header>

        <section class="stats-section" data-test-id="admin-stats">
          <div class="stat-card">
            <span class="stat-icon">📋</span>
            <span class="stat-value">{{ data.stats.totalCampaigns }}</span>
            <span class="stat-label">Total Campaigns</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">✅</span>
            <span class="stat-value">{{ data.stats.activeCampaigns }}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">👥</span>
            <span class="stat-value">{{ data.stats.totalEnrollments }}</span>
            <span class="stat-label">Total Students</span>
          </div>
        </section>

        <section class="campaigns-section">
          <h2>My Campaigns</h2>
          @if (data.campaigns.length === 0) {
            <div class="empty-state card">
              <span class="empty-icon">📋</span>
              <h3>No campaigns yet</h3>
              <p class="text-muted">Create your first campaign to get started!</p>
              <a routerLink="/admin/campaigns/create" class="btn btn-primary">Create Campaign</a>
            </div>
          } @else {
            <div class="campaigns-grid" data-test-id="admin-campaigns-list">
              @for (campaign of data.campaigns; track campaign.id) {
                <div class="campaign-card card-elevated" [attr.data-test-id]="'admin-campaign-' + campaign.id">
                  <div class="card-header">
                    <h3>{{ campaign.title }}</h3>
                    <span class="badge" [class]="getStatusClass(campaign.status)">{{ campaign.status }}</span>
                  </div>
                  <div class="card-stats">
                    <span>👥 {{ campaign.enrollmentCount || 0 }} students</span>
                    <span>⭐ {{ campaign.totalPoints || 0 }} pts</span>
                    <span>✅ {{ campaign.habits?.length || 0 }} habits</span>
                  </div>
                  
                  @if (campaign.sponsors && campaign.sponsors.length > 0) {
                    <div class="campaign-sponsors">
                      <h4>❤️ Sponsors</h4>
                      <ul>
                        @for (sponsor of campaign.sponsors; track sponsor.name) {
                          <li>
                            <strong>{{ sponsor.name }}</strong> 
                            <span class="text-muted">(\${{ sponsor.ratePerPoint }}/pt)</span>
                          </li>
                        }
                      </ul>
                    </div>
                  }

                  <div class="card-actions">
                    <a [routerLink]="['/campaigns', campaign.id]" class="btn btn-outline btn-sm">View</a>
                    @if (campaign.status === 'active') {
                      <button 
                        (click)="triggerReminders(campaign.id)" 
                        class="btn btn-primary btn-sm"
                        [disabled]="triggeringId === campaign.id">
                        {{ triggeringId === campaign.id ? 'Sending...' : 'Send Reminders' }}
                      </button>
                    }
                  </div>
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
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xl); }
    .dashboard-header h1 { margin-bottom: 4px; }
    .stats-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-xl); }
    .stat-card { background: var(--color-snow); padding: var(--spacing-lg); border-radius: var(--radius-lg); text-align: center; box-shadow: var(--shadow-sm); }
    .stat-icon { font-size: 32px; display: block; margin-bottom: var(--spacing-sm); }
    .stat-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); display: block; color: var(--color-primary); }
    .stat-label { font-size: var(--font-size-sm); color: var(--color-wolf); }
    .campaigns-section h2 { margin-bottom: var(--spacing-md); }
    .campaigns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-md); }
    .campaign-card { padding: var(--spacing-lg); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-sm); }
    .card-header h3 { font-size: var(--font-size-lg); }
    .card-stats { display: flex; gap: var(--spacing-md); font-size: var(--font-size-sm); color: var(--color-wolf); margin-bottom: var(--spacing-md); }
    .campaign-sponsors { margin-bottom: var(--spacing-md); background: var(--color-snow); padding: var(--spacing-md); border-radius: var(--radius-md); }
    .campaign-sponsors h4 { font-size: var(--font-size-xs); text-transform: uppercase; color: var(--color-wolf); margin-bottom: var(--spacing-xs); }
    .campaign-sponsors ul { list-style: none; padding: 0; margin: 0; font-size: var(--font-size-sm); }
    .card-actions { display: flex; gap: var(--spacing-sm); }
    .empty-state { text-align: center; padding: var(--spacing-2xl); }
    .empty-icon { font-size: 48px; display: block; margin-bottom: var(--spacing-md); }
    @media (max-width: 768px) { .stats-section { grid-template-columns: 1fr; } .campaigns-grid { grid-template-columns: 1fr; } }
  `],
})
export class AdminDashboardComponent implements OnInit {
  data: any = null;
  loading = true;
  triggeringId: string | null = null;

  constructor(
    private http: HttpClient,
    private campaignService: CampaignService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/dashboard/admin`).subscribe({
      next: (res) => { if (res.success) this.data = res.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = { active: 'badge-success', upcoming: 'badge-secondary', ended: 'badge-warning', paused: 'badge-warning' };
    return 'badge ' + (classes[status] || '');
  }

  triggerReminders(campaignId: string): void {
    if (!confirm('Are you sure you want to send daily habit reminders to all enrolled students now?')) {
      return;
    }

    this.triggeringId = campaignId;
    this.campaignService.triggerCampaignEmails(campaignId).subscribe({
      next: (res) => {
        if (res.success) {
          this.notificationService.success('Reminders sent successfully!');
        }
        this.triggeringId = null;
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to send reminders');
        this.triggeringId = null;
      }
    });
  }
}
