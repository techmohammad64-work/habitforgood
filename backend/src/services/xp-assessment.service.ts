// 🤖 AI-Powered XP Assessment Service
// Intelligently calculates XP based on habit difficulty, frequency, and effort

import { Campaign } from '../entities/campaign.entity';
import { Habit } from '../entities/habit.entity';

interface XPFactors {
  baseXP: number;
  difficultyMultiplier: number;
  frequencyMultiplier: number;
  durationBonus: number;
  effortScore: number;
}

interface AssessmentResult {
  recommendedXP: number;
  breakdown: XPFactors;
  reasoning: string;
}

export class XPAssessmentService {
  /**
   * Assess the appropriate XP for a campaign based on its habits
   */
  static assessCampaignXP(campaign: Campaign, habits: Habit[]): AssessmentResult {
    const factors: XPFactors = {
      baseXP: 10,
      difficultyMultiplier: 1,
      frequencyMultiplier: 1,
      durationBonus: 0,
      effortScore: 0
    };

    // 1. Calculate effort score from habits
    factors.effortScore = this.calculateEffortScore(habits, campaign);

    // 2. Calculate difficulty multiplier
    factors.difficultyMultiplier = this.calculateDifficultyMultiplier(campaign, habits);

    // 3. Calculate frequency multiplier
    factors.frequencyMultiplier = this.calculateFrequencyMultiplier(campaign);

    // 4. Calculate duration bonus
    factors.durationBonus = this.calculateDurationBonus(campaign);

    // 5. Calculate final XP
    const recommendedXP = Math.round(
      factors.baseXP * 
      factors.difficultyMultiplier * 
      factors.frequencyMultiplier + 
      factors.durationBonus
    );

    return {
      recommendedXP,
      breakdown: factors,
      reasoning: this.generateReasoning(campaign, factors, recommendedXP)
    };
  }

  /**
   * Calculate effort score based on habit complexity and physical demands
   */
  private static calculateEffortScore(habits: Habit[], campaign: Campaign): number {
    if (!habits || habits.length === 0) return 1;

    let totalScore = 0;
    const title = campaign.title.toLowerCase();
    const description = campaign.description?.toLowerCase() || '';

    for (const habit of habits) {
      const habitText = `${habit.name} ${habit.description || ''}`.toLowerCase();
      
      // Physical effort keywords (higher score)
      const physicalKeywords = [
        'run', 'jog', 'exercise', 'workout', 'pushup', 'situp', 
        'plank', 'squat', 'burpee', 'sprint', 'swim', 'bike',
        'walk', 'hike', 'climb', 'jump', 'lift', 'yoga'
      ];

      // Mental effort keywords (medium score)
      const mentalKeywords = [
        'read', 'study', 'learn', 'meditate', 'journal', 
        'practice', 'solve', 'write', 'memorize'
      ];

      // Low effort keywords (lower score)
      const lowEffortKeywords = [
        'drink', 'water', 'hydrate', 'check', 'log', 'record'
      ];

      let habitScore = 1;

      if (physicalKeywords.some(kw => habitText.includes(kw) || title.includes(kw))) {
        habitScore = 3;
      } else if (mentalKeywords.some(kw => habitText.includes(kw) || title.includes(kw))) {
        habitScore = 2;
      } else if (lowEffortKeywords.some(kw => habitText.includes(kw) || title.includes(kw))) {
        habitScore = 0.5;
      }

      // Check for quantity/distance in description
      const quantityMatch = description.match(/(\d+)\s*(km|mile|minute|hour|page)/i);
      if (quantityMatch) {
        const quantity = parseInt(quantityMatch[1]);
        const unit = quantityMatch[2].toLowerCase();
        
        if (unit === 'km' || unit === 'mile') {
          habitScore *= (1 + quantity * 0.3); // Running 5km = 2.5x multiplier
        } else if (unit === 'minute' || unit === 'hour') {
          habitScore *= (1 + (unit === 'hour' ? quantity * 0.5 : quantity * 0.05));
        }
      }

      totalScore += habitScore;
    }

    return totalScore / habits.length;
  }

  /**
   * Calculate difficulty multiplier based on effort score
   */
  private static calculateDifficultyMultiplier(campaign: Campaign, habits: Habit[]): number {
    const effortScore = this.calculateEffortScore(habits, campaign);
    
    // Map effort score to multiplier
    if (effortScore >= 5) return 5.0;  // Extreme (e.g., "Run 10km daily")
    if (effortScore >= 3) return 3.5;  // Hard (e.g., "100 pushups daily")
    if (effortScore >= 2) return 2.5;  // Medium-Hard (e.g., "Read 30 pages")
    if (effortScore >= 1.5) return 2.0; // Medium (e.g., "Exercise 30 min")
    if (effortScore >= 1) return 1.5;   // Easy-Medium (e.g., "Walk 1km")
    return 1.0;                          // Easy (e.g., "Drink water")
  }

  /**
   * Calculate frequency multiplier (daily = higher XP)
   */
  private static calculateFrequencyMultiplier(campaign: Campaign): number {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Longer campaigns with daily habits = more commitment
    if (durationDays >= 365) return 2.0;  // Year-long commitment
    if (durationDays >= 180) return 1.8;  // 6 months
    if (durationDays >= 90) return 1.6;   // 3 months
    if (durationDays >= 30) return 1.4;   // 1 month
    if (durationDays >= 7) return 1.2;    // 1 week
    return 1.0;                            // Short-term
  }

  /**
   * Calculate duration bonus (extra XP for long-term commitment)
   */
  private static calculateDurationBonus(campaign: Campaign): number {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Bonus XP for very long campaigns
    if (durationDays >= 365) return 50;   // +50 XP for year-long
    if (durationDays >= 180) return 25;   // +25 XP for 6 months
    if (durationDays >= 90) return 10;    // +10 XP for 3 months
    return 0;
  }

  /**
   * Generate human-readable reasoning
   */
  private static generateReasoning(campaign: Campaign, factors: XPFactors, finalXP: number): string {
    const parts: string[] = [];

    // Effort assessment
    if (factors.effortScore >= 3) {
      parts.push('High physical/mental effort required');
    } else if (factors.effortScore >= 1.5) {
      parts.push('Moderate effort required');
    } else {
      parts.push('Light effort required');
    }

    // Difficulty
    if (factors.difficultyMultiplier >= 3) {
      parts.push('challenging difficulty');
    } else if (factors.difficultyMultiplier >= 2) {
      parts.push('moderate difficulty');
    }

    // Duration
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (durationDays >= 365) {
      parts.push('year-long commitment');
    } else if (durationDays >= 90) {
      parts.push(`${Math.round(durationDays / 30)}-month commitment`);
    }

    return `${finalXP} XP awarded: ${parts.join(', ')}.`;
  }

  /**
   * Quick assessment for a single habit submission
   */
  static assessHabitSubmissionXP(habit: Habit, campaign: Campaign): number {
    const assessment = this.assessCampaignXP(campaign, [habit]);
    return Math.max(5, assessment.recommendedXP); // Minimum 5 XP
  }

  /**
   * Assess daily quest completion bonus
   */
  static assessDailyQuestBonus(totalHabitsCompleted: number, campaign: Campaign): number {
    // Bonus for completing all habits in a day
    const baseBonus = 20;
    const habitMultiplier = Math.min(totalHabitsCompleted * 5, 50); // Max +50
    return baseBonus + habitMultiplier;
  }

  /**
   * Compare current XP with recommended XP and suggest adjustment
   */
  static suggestXPAdjustment(campaign: Campaign, habits: Habit[], currentXPPerHabit: number): {
    shouldAdjust: boolean;
    recommendedXP: number;
    difference: number;
    reasoning: string;
  } {
    const assessment = this.assessCampaignXP(campaign, habits);
    const difference = assessment.recommendedXP - currentXPPerHabit;
    const percentDiff = Math.abs(difference / currentXPPerHabit) * 100;

    return {
      shouldAdjust: percentDiff > 30, // Suggest adjustment if >30% difference
      recommendedXP: assessment.recommendedXP,
      difference,
      reasoning: assessment.reasoning
    };
  }
}
