import { AppDataSource } from '../config/database';
import { Achievement, AchievementCategory } from '../entities/achievement.entity';
import { Student } from '../entities/student.entity';
import { Streak } from '../entities/streak.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { MoreThan } from 'typeorm';

interface AchievementDefinition {
  title: string;
  description: string;
  category: AchievementCategory;
  xpReward: number;
  pointsReward: number;
  iconUrl?: string;
  checkCondition: (student: Student, data?: any) => Promise<boolean>;
}

// Define all possible achievements
const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Rank Achievements
  {
    title: 'D-Rank Hunter',
    description: 'Reached D-Rank',
    category: AchievementCategory.RANK,
    xpReward: 100,
    pointsReward: 50,
    iconUrl: '/assets/achievements/d-rank.png',
    checkCondition: async (student) => student.rank === 'D-Rank',
  },
  {
    title: 'C-Rank Hunter',
    description: 'Reached C-Rank',
    category: AchievementCategory.RANK,
    xpReward: 200,
    pointsReward: 100,
    iconUrl: '/assets/achievements/c-rank.png',
    checkCondition: async (student) => student.rank === 'C-Rank',
  },
  {
    title: 'B-Rank Hunter',
    description: 'Reached B-Rank',
    category: AchievementCategory.RANK,
    xpReward: 500,
    pointsReward: 250,
    iconUrl: '/assets/achievements/b-rank.png',
    checkCondition: async (student) => student.rank === 'B-Rank',
  },
  {
    title: 'A-Rank Hunter',
    description: 'Reached A-Rank',
    category: AchievementCategory.RANK,
    xpReward: 1000,
    pointsReward: 500,
    iconUrl: '/assets/achievements/a-rank.png',
    checkCondition: async (student) => student.rank === 'A-Rank',
  },
  {
    title: 'S-Rank Hunter',
    description: 'Reached S-Rank - Elite Status',
    category: AchievementCategory.RANK,
    xpReward: 2000,
    pointsReward: 1000,
    iconUrl: '/assets/achievements/s-rank.png',
    checkCondition: async (student) => student.rank === 'S-Rank',
  },
  {
    title: 'National Level Hunter',
    description: 'Reached National Level - Legendary Status',
    category: AchievementCategory.RANK,
    xpReward: 5000,
    pointsReward: 2500,
    iconUrl: '/assets/achievements/national-level.png',
    checkCondition: async (student) => student.rank === 'National Level',
  },

  // Streak Achievements
  {
    title: 'Streak Starter',
    description: 'Maintained a 7-day streak',
    category: AchievementCategory.STREAK,
    xpReward: 50,
    pointsReward: 25,
    iconUrl: '/assets/achievements/streak-7.png',
    checkCondition: async (student) => {
      const streakRepo = AppDataSource.getRepository(Streak);
      const maxStreak = await streakRepo
        .createQueryBuilder('streak')
        .select('MAX(streak.current_streak)', 'max')
        .where('streak.student_id = :studentId', { studentId: student.id })
        .getRawOne();
      return maxStreak?.max >= 7;
    },
  },
  {
    title: 'Dedicated Hunter',
    description: 'Maintained a 30-day streak',
    category: AchievementCategory.STREAK,
    xpReward: 200,
    pointsReward: 100,
    iconUrl: '/assets/achievements/streak-30.png',
    checkCondition: async (student) => {
      const streakRepo = AppDataSource.getRepository(Streak);
      const maxStreak = await streakRepo
        .createQueryBuilder('streak')
        .select('MAX(streak.current_streak)', 'max')
        .where('streak.student_id = :studentId', { studentId: student.id })
        .getRawOne();
      return maxStreak?.max >= 30;
    },
  },
  {
    title: 'Iron Will',
    description: 'Maintained a 100-day streak',
    category: AchievementCategory.STREAK,
    xpReward: 1000,
    pointsReward: 500,
    iconUrl: '/assets/achievements/streak-100.png',
    checkCondition: async (student) => {
      const streakRepo = AppDataSource.getRepository(Streak);
      const maxStreak = await streakRepo
        .createQueryBuilder('streak')
        .select('MAX(streak.current_streak)', 'max')
        .where('streak.student_id = :studentId', { studentId: student.id })
        .getRawOne();
      return maxStreak?.max >= 100;
    },
  },

  // Level Achievements
  {
    title: 'Level 10 Reached',
    description: 'Reached Level 10',
    category: AchievementCategory.LEVEL,
    xpReward: 100,
    pointsReward: 50,
    checkCondition: async (student) => student.level >= 10,
  },
  {
    title: 'Level 25 Reached',
    description: 'Reached Level 25',
    category: AchievementCategory.LEVEL,
    xpReward: 250,
    pointsReward: 125,
    checkCondition: async (student) => student.level >= 25,
  },
  {
    title: 'Level 50 Reached',
    description: 'Reached Level 50 - Veteran',
    category: AchievementCategory.LEVEL,
    xpReward: 500,
    pointsReward: 250,
    checkCondition: async (student) => student.level >= 50,
  },

  // Campaign Achievements
  {
    title: 'First Quest',
    description: 'Joined your first campaign',
    category: AchievementCategory.CAMPAIGN,
    xpReward: 25,
    pointsReward: 10,
    iconUrl: '/assets/achievements/first-quest.png',
    checkCondition: async (student) => {
      const enrollmentRepo = AppDataSource.getRepository(Enrollment);
      const count = await enrollmentRepo.count({
        where: { studentId: student.id },
      });
      return count >= 1;
    },
  },
  {
    title: 'Quest Master',
    description: 'Completed 10 campaigns',
    category: AchievementCategory.CAMPAIGN,
    xpReward: 300,
    pointsReward: 150,
    iconUrl: '/assets/achievements/quest-master.png',
    checkCondition: async (student) => {
      const enrollmentRepo = AppDataSource.getRepository(Enrollment);
      const count = await enrollmentRepo.count({
        where: { studentId: student.id },
      });
      return count >= 10;
    },
  },

  // Special Achievements
  {
    title: 'Early Adopter',
    description: 'Joined during the beta phase',
    category: AchievementCategory.SPECIAL,
    xpReward: 500,
    pointsReward: 250,
    iconUrl: '/assets/achievements/early-adopter.png',
    checkCondition: async (student) => {
      // Check if student created before launch date (adjust as needed)
      const launchDate = new Date('2026-01-01');
      return student.createdAt < launchDate;
    },
  },
];

export class AchievementService {
  private achievementRepo = AppDataSource.getRepository(Achievement);
  private studentRepo = AppDataSource.getRepository(Student);

  // Check and grant achievements for a student
  async checkAndGrantAchievements(studentId: string): Promise<Achievement[]> {
    const student = await this.studentRepo.findOne({
      where: { id: parseInt(studentId) },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const newAchievements: Achievement[] = [];

    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      // Check if student already has this achievement
      const existingAchievement = await this.achievementRepo.findOne({
        where: {
          studentId,
          title: definition.title,
        },
      });

      if (existingAchievement) {
        continue; // Already unlocked
      }

      // Check if condition is met
      const conditionMet = await definition.checkCondition(student);

      if (conditionMet) {
        // Grant achievement
        const achievement = this.achievementRepo.create({
          studentId,
          category: definition.category,
          title: definition.title,
          description: definition.description,
          iconUrl: definition.iconUrl,
          xpReward: definition.xpReward,
          pointsReward: definition.pointsReward,
        });

        await this.achievementRepo.save(achievement);
        newAchievements.push(achievement);

        // Award XP and Points to student
        student.xp += definition.xpReward;
        await this.studentRepo.save(student);

        console.log(`🏆 Achievement Unlocked: ${definition.title} for student ${studentId}`);
      }
    }

    return newAchievements;
  }

  // Get all achievements for a student
  async getStudentAchievements(studentId: string): Promise<Achievement[]> {
    return this.achievementRepo.find({
      where: { studentId },
      order: { unlockedAt: 'DESC' },
    });
  }

  // Get achievement progress (what's next)
  async getAchievementProgress(studentId: string): Promise<any[]> {
    const student = await this.studentRepo.findOne({
      where: { id: parseInt(studentId) },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const progress = [];

    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      const existingAchievement = await this.achievementRepo.findOne({
        where: {
          studentId,
          title: definition.title,
        },
      });

      if (existingAchievement) {
        continue; // Already unlocked
      }

      // Calculate progress percentage (simplified)
      let progressPercentage = 0;

      if (definition.category === AchievementCategory.RANK) {
        const rankOrder = ['E-Rank', 'D-Rank', 'C-Rank', 'B-Rank', 'A-Rank', 'S-Rank', 'National Level'];
        const currentIndex = rankOrder.indexOf(student.rank);
        const targetRank = definition.title.split(' ')[0];
        const targetIndex = rankOrder.indexOf(targetRank);
        progressPercentage = (currentIndex / targetIndex) * 100;
      } else if (definition.category === AchievementCategory.LEVEL) {
        const targetLevel = parseInt(definition.title.match(/\d+/)?.[0] || '0');
        progressPercentage = (student.level / targetLevel) * 100;
      }

      progress.push({
        ...definition,
        unlocked: false,
        progress: Math.min(progressPercentage, 100),
      });
    }

    return progress;
  }
}

export const achievementService = new AchievementService();
