import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HabitService, SubmitResponse } from '@core/services/habit.service';
import { CampaignService, Habit } from '@core/services/campaign.service';

type Rating = 'great' | 'good' | 'okay' | 'hard';

@Component({
  selector: 'app-habit-submit',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="submit-page">
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      } @else if (submitted) {
        <!-- Success State -->
        <div class="success-state" data-test-id="submission-success">
          <div class="success-animation">
            <span class="success-icon animate-celebrate">🎉</span>
          </div>
          <h1>Amazing Job!</h1>
          <p class="success-message">You completed today's habits!</p>
          
          <div class="points-earned card-elevated">
            <span class="points-label">Points Earned</span>
            <span class="points-value" data-test-id="points-earned">+{{ submissionResult?.points?.total || 10 }}</span>
            @if ((submissionResult?.points?.streakMultiplier || 0) > 1) {
              <span class="multiplier-badge">🔥 {{ submissionResult?.points?.streakMultiplier }}x streak bonus!</span>
            }
          </div>
          
          <div class="streak-info card">
            <span class="streak-icon">🔥</span>
            <div class="streak-text">
              <span class="streak-value" data-test-id="current-streak">{{ submissionResult?.streak?.current || 1 }}</span>
              <span class="streak-label">Day Streak!</span>
            </div>
          </div>
          
          <div class="success-actions">
            <a routerLink="/student/dashboard" class="btn btn-primary btn-lg" data-test-id="back-to-dashboard-button">
              Back to Dashboard
            </a>
          </div>
        </div>
      } @else if (alreadySubmitted) {
        <!-- Already Submitted -->
        <div class="already-submitted" data-test-id="already-submitted">
          <span class="check-icon">✅</span>
          <h1>All Done for Today!</h1>
          <p class="text-muted">You've already submitted your habits. Come back tomorrow!</p>
          
          <div class="streak-info card">
            <span class="streak-icon">🔥</span>
            <div class="streak-text">
              <span class="streak-value">{{ currentStreak }}</span>
              <span class="streak-label">Day Streak</span>
            </div>
          </div>
          
          <a routerLink="/student/dashboard" class="btn btn-primary btn-lg">
            Back to Dashboard
          </a>
        </div>
      } @else {
        <!-- Submit Form -->
        <div class="submit-form">
          <header class="submit-header">
            <a routerLink="/student/dashboard" class="back-link">← Back</a>
            <h1 data-test-id="submit-title">Today's Habits</h1>
            <p class="text-muted">Did you complete all your habits today?</p>
          </header>

          <!-- Habits List -->
          <section class="habits-list" data-test-id="habits-list">
            @for (habit of habits; track habit.id) {
              <div class="habit-item" [attr.data-test-id]="'habit-check-' + habit.id">
                <div class="habit-check">
                  <span class="habit-icon">{{ getHabitIcon(habit.icon) }}</span>
                </div>
                <div class="habit-info">
                  <h3>{{ habit.name }}</h3>
                  @if (habit.description) {
                    <p>{{ habit.description }}</p>
                  }
                </div>
              </div>
            }
          </section>

          <!-- Rating Selection -->
          <section class="rating-section">
            <h2>How did today go?</h2>
            <div class="rating-options" data-test-id="rating-options">
              @for (option of ratingOptions; track option.value) {
                <button 
                  class="rating-btn" 
                  [class.selected]="selectedRating === option.value"
                  (click)="selectRating(option.value)"
                  [attr.data-test-id]="'rating-' + option.value"
                >
                  <span class="rating-emoji">{{ option.emoji }}</span>
                  <span class="rating-label">{{ option.label }}</span>
                </button>
              }
            </div>
          </section>

          <!-- Making a Difference (Ad) -->
          @if (activeAd) {
            <section class="ad-section card-elevated">
              <span class="ad-label">Sponsored by {{ activeAd.sponsorName }}</span>
              <div class="ad-content">
                @if (activeAd.adImageUrl) {
                  <img [src]="activeAd.adImageUrl" alt="Sponsor Ad" class="ad-image">
                }
                <p class="ad-message">"{{ activeAd.message }}"</p>
              </div>
            </section>
          }

          <!-- Submit Button -->
          <div class="submit-action">
            <button 
              class="btn btn-primary btn-lg submit-btn"
              [disabled]="submitting"
              (click)="submit()"
              data-test-id="habit-submit-button"
            >
              @if (submitting) {
                <span class="spinner spinner-sm"></span>
                Submitting...
              } @else {
                I Did It! ✨
              }
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .submit-page {
      max-width: 600px;
      margin: 0 auto;
      padding: var(--spacing-md);
    }
    
    .loading-state {
      text-align: center;
      padding: var(--spacing-3xl);
    }
    
    /* Success State */
    .success-state {
      text-align: center;
      padding: var(--spacing-xl) 0;
    }
    
    .success-animation {
      margin-bottom: var(--spacing-lg);
    }
    
    .success-icon {
      font-size: 80px;
      display: inline-block;
    }
    
    .success-state h1 {
      font-size: var(--font-size-3xl);
      color: var(--color-primary);
      margin-bottom: var(--spacing-sm);
    }
    
    .success-message {
      font-size: var(--font-size-lg);
      color: var(--color-wolf);
      margin-bottom: var(--spacing-xl);
    }
    
    .points-earned {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-lg);
      background: linear-gradient(135deg, var(--color-bee) 0%, var(--color-fox) 100%);
      color: white;
    }
    
    .points-label {
      font-size: var(--font-size-sm);
      opacity: 0.9;
    }
    
    .points-value {
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-extrabold);
    }
    
    .multiplier-badge {
      margin-top: var(--spacing-sm);
      padding: 4px 12px;
      background: rgba(255,255,255,0.3);
      border-radius: var(--radius-pill);
      font-size: var(--font-size-sm);
    }
    
    .streak-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }
    
    .streak-icon {
      font-size: 40px;
    }
    
    .streak-text {
      display: flex;
      flex-direction: column;
    }
    
    .streak-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-fox);
    }
    
    .streak-label {
      font-size: var(--font-size-sm);
      color: var(--color-wolf);
    }
    
    /* Already Submitted */
    .already-submitted {
      text-align: center;
      padding: var(--spacing-xl) 0;
    }
    
    .check-icon {
      font-size: 64px;
      display: block;
      margin-bottom: var(--spacing-md);
    }
    
    /* Submit Form */
    .submit-header {
      text-align: center;
      margin-bottom: var(--spacing-xl);
    }
    
    .back-link {
      display: inline-block;
      margin-bottom: var(--spacing-md);
      color: var(--color-wolf);
      
      &:hover {
        color: var(--color-primary);
      }
    }
    
    .submit-header h1 {
      margin-bottom: var(--spacing-xs);
    }
    
    /* Habits List */
    .habits-list {
      margin-bottom: var(--spacing-xl);
    }
    
    .habit-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--color-snow);
      border-radius: var(--radius-lg);
      margin-bottom: var(--spacing-sm);
      box-shadow: var(--shadow-sm);
    }
    
    .habit-check {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-mint);
      border-radius: var(--radius-circle);
    }
    
    .habit-icon {
      font-size: 28px;
    }
    
    .habit-info h3 {
      font-size: var(--font-size-base);
      margin-bottom: 2px;
    }
    
    .habit-info p {
      font-size: var(--font-size-sm);
      color: var(--color-wolf);
      margin: 0;
    }
    
    /* Rating */
    .rating-section {
      text-align: center;
      margin-bottom: var(--spacing-xl);
    }
    
    .rating-section h2 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-md);
    }
    
    .rating-options {
      display: flex;
      justify-content: center;
      gap: var(--spacing-sm);
    }
    
    .rating-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-md);
      background: var(--color-snow);
      border: 2px solid var(--color-hare);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-fast);
      min-width: 80px;
      font-family: var(--font-family);
      
      &:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
      }
      
      &.selected {
        border-color: var(--color-primary);
        background: var(--color-mint);
      }
    }
    
    .rating-emoji {
      font-size: 32px;
    }
    
    .rating-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-wolf);
    }
    
    /* Submit Button */
    .submit-action {
      text-align: center;
    }
    
    .submit-btn {
      width: 100%;
      font-size: var(--font-size-lg);
      padding: var(--spacing-md) var(--spacing-xl);
    }
    
    .success-actions {
      margin-top: var(--spacing-lg);
    }
    
    .success-actions .btn {
      width: 100%;
    }
    
    .ad-section {
      background: linear-gradient(to right, var(--color-mint), var(--color-snow));
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
      border-radius: var(--radius-lg);
      text-align: center;
      border: 1px solid var(--color-mint);
    }
    .ad-label { font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 1px; color: var(--color-wolf); display: block; margin-bottom: var(--spacing-sm); }
    .ad-content { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-md); }
    .ad-image { max-width: 100%; max-height: 150px; border-radius: var(--radius-md); }
    .ad-message { font-style: italic; font-size: var(--font-size-lg); color: var(--color-eel); font-weight: var(--font-weight-serif); }
  `],
})
export class HabitSubmitComponent implements OnInit {
  campaignId = '';
  habits: Habit[] = [];
  loading = true;
  submitting = false;
  submitted = false;
  alreadySubmitted = false;
  currentStreak = 0;
  selectedRating: Rating | null = null;
  submissionResult: SubmitResponse | null = null;
  activeAd: { sponsorName: string; message: string; adImageUrl: string } | null = null;

  ratingOptions: { value: Rating; emoji: string; label: string }[] = [
    { value: 'great', emoji: '🤩', label: 'Great!' },
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'hard', emoji: '😅', label: 'Hard' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private habitService: HabitService,
    private campaignService: CampaignService
  ) { }

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('campaignId') || '';
    if (this.campaignId) {
      this.loadTodayHabits();
      this.loadActiveAd();
    }
  }

  loadActiveAd(): void {
    this.campaignService.getActiveAd(this.campaignId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.activeAd = res.data;
        }
      }
    });
  }

  loadTodayHabits(): void {
    this.habitService.getTodayHabits(this.campaignId).subscribe({
      next: (response) => {
        if (response.success) {
          this.habits = response.data.habits;
          this.alreadySubmitted = response.data.submittedToday;
          this.currentStreak = response.data.streak.current;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  selectRating(rating: Rating): void {
    this.selectedRating = rating;
  }

  submit(): void {
    this.submitting = true;

    this.habitService.submitHabits(this.campaignId, this.selectedRating || undefined).subscribe({
      next: (response) => {
        if (response.success) {
          this.submissionResult = response.data;
          this.submitted = true;
        }
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
      },
    });
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
