// 🚀 Viral Growth & Social Features Service
// Implements referral system, social sharing, leaderboards, and achievement cards

import { AppDataSource } from '../config/database';
import { Student } from '../entities/student.entity';
import { Campaign } from '../entities/campaign.entity';
import { Streak } from '../entities/streak.entity';
import { randomBytes } from 'crypto';

interface ReferralCode {
  code: string;
  referrerId: string;
  uses: number;
  maxUses: number;
  expiresAt: Date;
  rewards: {
    referrerXP: number;
    referredXP: number;
  };
}

interface ShareableCard {
  type: 'rank-up' | 'achievement' | 'streak' | 'leaderboard';
  imageUrl: string;
  title: string;
  description: string;
  shareUrl: string;
}

interface LeaderboardEntry {
  rank: number;
  student: {
    id: string;
    displayName: string;
    level: number;
    rank: string;
    xp: number;
  };
  score: number;
  change: 'up' | 'down' | 'same';
}

export class ViralGrowthService {
  private studentRepo = AppDataSource.getRepository(Student);
  private campaignRepo = AppDataSource.getRepository(Campaign);
  private streakRepo = AppDataSource.getRepository(Streak);

  // Referral system storage (in production, use Redis or database)
  private static referralCodes: Map<string, ReferralCode> = new Map();

  /**
   * Generate a unique referral code for a student
   */
  async generateReferralCode(studentId: string, maxUses: number = 10): Promise<string> {
    const student = await this.studentRepo.findOne({ where: { id: parseInt(studentId, 10) } });
    if (!student) throw new Error('Student not found');

    // Generate unique code
    const code = `${student.displayName.substring(0, 3).toUpperCase()}${randomBytes(4).toString('hex').toUpperCase()}`;

    const referralData: ReferralCode = {
      code,
      referrerId: studentId,
      uses: 0,
      maxUses,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      rewards: {
        referrerXP: 500,  // Referrer gets 500 XP
        referredXP: 250   // New user gets 250 XP welcome bonus
      }
    };

    ViralGrowthService.referralCodes.set(code, referralData);
    return code;
  }

  /**
   * Apply referral code when new student signs up
   */
  async applyReferralCode(newStudentId: string, referralCode: string): Promise<{
    success: boolean;
    referrerReward: number;
    referredReward: number;
    message: string;
  }> {
    const referral = ViralGrowthService.referralCodes.get(referralCode);

    if (!referral) {
      return { success: false, referrerReward: 0, referredReward: 0, message: 'Invalid referral code' };
    }

    if (referral.uses >= referral.maxUses) {
      return { success: false, referrerReward: 0, referredReward: 0, message: 'Referral code limit reached' };
    }

    if (new Date() > referral.expiresAt) {
      return { success: false, referrerReward: 0, referredReward: 0, message: 'Referral code expired' };
    }

    // Award XP to both parties
    const referrer = await this.studentRepo.findOne({ where: { id: parseInt(referral.referrerId, 10) } });
    const newStudent = await this.studentRepo.findOne({ where: { id: parseInt(newStudentId, 10) } });

    if (!referrer || !newStudent) {
      return { success: false, referrerReward: 0, referredReward: 0, message: 'User not found' };
    }

    // Update XP
    referrer.xp = (referrer.xp || 0) + referral.rewards.referrerXP;
    newStudent.xp = (newStudent.xp || 0) + referral.rewards.referredXP;

    await this.studentRepo.save([referrer, newStudent]);

    // Increment usage
    referral.uses++;
    ViralGrowthService.referralCodes.set(referralCode, referral);

    return {
      success: true,
      referrerReward: referral.rewards.referrerXP,
      referredReward: referral.rewards.referredXP,
      message: `🎉 Welcome bonus: ${referral.rewards.referredXP} XP!`
    };
  }

  /**
   * Generate shareable card for rank-up
   */
  async generateRankUpCard(studentId: string): Promise<ShareableCard> {
    const student = await this.studentRepo.findOne({ where: { id: parseInt(studentId, 10) } });
    if (!student) throw new Error('Student not found');

    return {
      type: 'rank-up',
      imageUrl: `/api/share/rank-card/${studentId}`, // Dynamic image generation endpoint
      title: `${student.displayName} reached ${student.rank}!`,
      description: `Level ${student.level} • ${student.xp} XP`,
      shareUrl: `${process.env.API_URL_PUBLIC}/share/rank/${studentId}`
    };
  }

  /**
   * Generate shareable card for achievement
   */
  async generateAchievementCard(studentId: string, achievementName: string): Promise<ShareableCard> {
    const student = await this.studentRepo.findOne({ where: { id: parseInt(studentId, 10) } });
    if (!student) throw new Error('Student not found');

    return {
      type: 'achievement',
      imageUrl: `/api/share/achievement-card/${studentId}/${encodeURIComponent(achievementName)}`,
      title: `${student.displayName} unlocked: ${achievementName}`,
      description: 'Join Habits for Good and level up!',
      shareUrl: `${process.env.API_URL_PUBLIC}/share/achievement/${studentId}`
    };
  }

  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(
    metric: 'xp' | 'level' | 'streak' = 'xp',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    let query = this.studentRepo.createQueryBuilder('student');

    if (metric === 'xp') {
      query = query.orderBy('student.xp', 'DESC');
    } else if (metric === 'level') {
      query = query.orderBy('student.level', 'DESC').addOrderBy('student.xp', 'DESC');
    } else if (metric === 'streak') {
      query = query
        .leftJoinAndSelect('student.streaks', 'streak')
        .orderBy('streak.currentStreak', 'DESC');
    }

    const students = await query.limit(limit).getMany();

    return students.map((student, index) => ({
      rank: index + 1,
      student: {
        id: student.id.toString(),
        displayName: student.displayName,
        level: student.level || 1,
        rank: student.rank || 'E-Rank',
        xp: student.xp || 0
      },
      score: metric === 'xp' ? student.xp || 0 : student.level || 1,
      change: 'same' as const // Would track this with historical data
    }));
  }

  /**
   * Get student's leaderboard position
   */
  async getStudentLeaderboardPosition(studentId: string, metric: 'xp' | 'level' = 'xp'): Promise<{
    position: number;
    total: number;
    percentile: number;
    nearbyPlayers: LeaderboardEntry[];
  }> {
    const leaderboard = await this.getGlobalLeaderboard(metric, 10000);
    const studentPosition = leaderboard.findIndex(entry => entry.student.id === studentId);

    if (studentPosition === -1) {
      return {
        position: leaderboard.length + 1,
        total: leaderboard.length,
        percentile: 0,
        nearbyPlayers: []
      };
    }

    // Get nearby players (3 above, 3 below)
    const start = Math.max(0, studentPosition - 3);
    const end = Math.min(leaderboard.length, studentPosition + 4);
    const nearbyPlayers = leaderboard.slice(start, end);

    return {
      position: studentPosition + 1,
      total: leaderboard.length,
      percentile: Math.round(((leaderboard.length - studentPosition) / leaderboard.length) * 100),
      nearbyPlayers
    };
  }

  /**
   * Generate viral share text for social media
   */
  generateShareText(type: 'rank-up' | 'achievement' | 'streak', data: any): string {
    switch (type) {
      case 'rank-up':
        return `🎮 Just reached ${data.rank} in Habits for Good! Level ${data.level} and climbing! 💪 Join me: ${data.shareUrl}`;
      
      case 'achievement':
        return `🏆 Achievement Unlocked: ${data.achievementName}! Building healthy habits one day at a time. Join the quest: ${data.shareUrl}`;
      
      case 'streak':
        return `🔥 ${data.streakDays} day streak! Consistency is 🔑. Start your journey: ${data.shareUrl}`;
      
      default:
        return `Check out my progress on Habits for Good! ${data.shareUrl}`;
    }
  }

  /**
   * Track viral metrics (would integrate with analytics)
   */
  async trackShare(studentId: string, type: string, platform: string): Promise<void> {
    // In production: Log to analytics service
    console.log(`[Viral] Student ${studentId} shared ${type} on ${platform}`);
    
    // Award small XP bonus for sharing
    const student = await this.studentRepo.findOne({ where: { id: parseInt(studentId, 10) } });
    if (student) {
      student.xp = (student.xp || 0) + 10; // +10 XP for sharing
      await this.studentRepo.save(student);
    }
  }

  /**
   * Get viral growth metrics for analytics
   */
  async getViralMetrics(dateRange: { start: Date; end: Date }): Promise<{
    totalReferrals: number;
    successfulReferrals: number;
    conversionRate: number;
    topReferrers: Array<{ studentId: string; displayName: string; referrals: number }>;
    sharesByType: Record<string, number>;
  }> {
    // Count referral codes and uses
    const allReferrals = Array.from(ViralGrowthService.referralCodes.values());
    const totalReferrals = allReferrals.length;
    const successfulReferrals = allReferrals.reduce((sum, ref) => sum + ref.uses, 0);

    // Get top referrers
    const referrerMap = new Map<string, number>();
    allReferrals.forEach(ref => {
      referrerMap.set(ref.referrerId, (referrerMap.get(ref.referrerId) || 0) + ref.uses);
    });

    const topReferrerIds = Array.from(referrerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topReferrers = await Promise.all(
      topReferrerIds.map(async ([studentId, referrals]) => {
        const student = await this.studentRepo.findOne({ where: { id: parseInt(studentId, 10) } });
        return {
          studentId,
          displayName: student?.displayName || 'Unknown',
          referrals
        };
      })
    );

    return {
      totalReferrals,
      successfulReferrals,
      conversionRate: totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0,
      topReferrers,
      sharesByType: {} // Would track from analytics
    };
  }
}
