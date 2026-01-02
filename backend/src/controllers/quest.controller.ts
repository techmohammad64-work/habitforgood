import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DailyQuest, QuestStatus } from '../entities/daily-quest.entity';
import { PenaltyQuest, PenaltyStatus, PenaltyType } from '../entities/penalty-quest.entity';
import { Reward, RewardType, RewardRarity } from '../entities/reward.entity';
import { Achievement, AchievementCategory } from '../entities/achievement.entity';
import { Student } from '../entities/student.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Habit } from '../entities/habit.entity';
import { HabitSubmission } from '../entities/habit-submission.entity';
import { Streak } from '../entities/streak.entity';
import { Between, LessThan } from 'typeorm';
import { achievementService } from '../services/achievement.service';
import { randomBoxService } from '../services/random-box.service';

// Get current daily quests for student
export const getDailyQuests = async (req: Request, res: Response) => {
  try {
    const dailyQuestRepo = AppDataSource.getRepository(DailyQuest);
    const studentId = (req as any).user.userId.toString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const quests = await dailyQuestRepo.find({
      where: {
        studentId,
        questDate: Between(today, tomorrow),
      },
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
    });

    res.json({ success: true, data: quests });
  } catch (error: any) {
    console.error('Error fetching daily quests:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// Get pending penalty quests
export const getPenaltyQuests = async (req: Request, res: Response) => {
  try {
    const penaltyQuestRepo = AppDataSource.getRepository(PenaltyQuest);
    const studentId = (req as any).user.userId.toString();

    const penalties = await penaltyQuestRepo.find({
      where: {
        studentId,
        status: PenaltyStatus.PENDING,
      },
      relations: ['campaign'],
      order: { deadline: 'ASC' },
    });

    res.json({ success: true, data: penalties });
  } catch (error: any) {
    console.error('Error fetching penalty quests:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// Complete a penalty quest
export const completePenaltyQuest = async (req: Request, res: Response) => {
  try {
    const penaltyQuestRepo = AppDataSource.getRepository(PenaltyQuest);
    const { penaltyId } = req.params;
    const studentId = (req as any).user.userId.toString();

    const penalty = await penaltyQuestRepo.findOne({
      where: { id: penaltyId, studentId },
    });

    if (!penalty) {
      return res.status(404).json({ success: false, error: { message: 'Penalty quest not found' } });
    }

    if (penalty.status !== PenaltyStatus.PENDING) {
      return res.status(400).json({ success: false, error: { message: 'Penalty quest already completed or failed' } });
    }

    if (new Date() > penalty.deadline) {
      penalty.status = PenaltyStatus.FAILED;
      await penaltyQuestRepo.save(penalty);
      return res.status(400).json({ success: false, error: { message: 'Penalty quest deadline exceeded' } });
    }

    penalty.status = PenaltyStatus.COMPLETED;
    penalty.completedAt = new Date();
    await penaltyQuestRepo.save(penalty);

    res.json({ success: true, data: penalty });
  } catch (error: any) {
    console.error('Error completing penalty quest:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// Get rewards for student
export const getRewards = async (req: Request, res: Response) => {
  try {
    const rewardRepo = AppDataSource.getRepository(Reward);
    const studentId = (req as any).user.userId.toString();

    const rewards = await rewardRepo.find({
      where: { studentId },
      order: { receivedAt: 'DESC' },
    });

    res.json({ success: true, data: rewards });
  } catch (error: any) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// Get achievements for student
export const getAchievements = async (req: Request, res: Response) => {
  try {
    const achievementRepo = AppDataSource.getRepository(Achievement);
    const studentId = (req as any).user.userId.toString();

    const achievements = await achievementRepo.find({
      where: { studentId },
      order: { unlockedAt: 'DESC' },
    });

    res.json({ success: true, data: achievements });
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// Check and create daily quests (called when student logs in or submits habit)
export const checkDailyQuests = async (studentId: string) => {
  const dailyQuestRepo = AppDataSource.getRepository(DailyQuest);
  const enrollmentRepo = AppDataSource.getRepository(Enrollment);
  const habitRepo = AppDataSource.getRepository(Habit);
  
  const studentIdNum = parseInt(studentId, 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Get enrollments
  const enrollments = await enrollmentRepo.find({
    where: { studentId: studentIdNum },
    relations: ['campaign'],
  });

  for (const enrollment of enrollments) {
    // Check if quest already exists for today
    const existingQuest = await dailyQuestRepo.findOne({
      where: {
        studentId,
        campaignId: enrollment.campaignId.toString(),
        questDate: Between(today, tomorrow),
      },
    });

    if (!existingQuest) {
      // Count habits in campaign
      const totalHabits = await habitRepo.count({
        where: { campaignId: enrollment.campaignId },
      });

      if (totalHabits > 0) {
        const quest = dailyQuestRepo.create({
          studentId,
          campaignId: enrollment.campaignId.toString(),
          questDate: today,
          totalHabits,
          completedHabits: 0,
          status: QuestStatus.IN_PROGRESS,
          bonusXp: Math.ceil(totalHabits * 5), // 5 XP per habit as bonus
          bonusPoints: Math.ceil(totalHabits * 2), // 2 points per habit as bonus
          deadline: endOfDay,
        });

        await dailyQuestRepo.save(quest);
      }
    }
  }
};

// Check quest completion after habit submission
export const checkQuestCompletion = async (studentId: string, campaignId: string) => {
  const dailyQuestRepo = AppDataSource.getRepository(DailyQuest);
  const habitSubmissionRepo = AppDataSource.getRepository(HabitSubmission);
  const studentRepo = AppDataSource.getRepository(Student);
  
  const studentIdNum = parseInt(studentId, 10);
  const campaignIdNum = parseInt(campaignId, 10);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const quest = await dailyQuestRepo.findOne({
    where: {
      studentId,
      campaignId,
      questDate: Between(today, tomorrow),
      status: QuestStatus.IN_PROGRESS,
    },
  });

  if (!quest) return;

  // Count completed habits today
  const startOfDay = new Date(today);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const completedCount = await habitSubmissionRepo.count({
    where: {
      studentId: studentIdNum,
      submittedAt: Between(startOfDay, endOfDay),
      campaignId: campaignIdNum,
    },
  });

  quest.completedHabits = completedCount;

  if (completedCount >= quest.totalHabits) {
    quest.status = QuestStatus.COMPLETED;
    quest.completedAt = new Date();

    // Award bonus XP
    const student = await studentRepo.findOne({ where: { id: parseInt(studentId) } });
    if (student) {
      student.xp += quest.bonusXp;

      // Check for level up
      await checkLevelUp(student);
      await studentRepo.save(student);

      // Generate random reward
      await generateRandomReward(studentId);
    }
  }

  await dailyQuestRepo.save(quest);
};

// Check for failed quests and issue penalties
export const checkFailedQuests = async () => {
  const dailyQuestRepo = AppDataSource.getRepository(DailyQuest);
  const penaltyQuestRepo = AppDataSource.getRepository(PenaltyQuest);
  const studentRepo = AppDataSource.getRepository(Student);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  const failedQuests = await dailyQuestRepo.find({
    where: {
      status: QuestStatus.IN_PROGRESS,
      deadline: LessThan(new Date()),
    },
  });

  for (const quest of failedQuests) {
    quest.status = QuestStatus.FAILED;
    await dailyQuestRepo.save(quest);

    // Check if penalty already issued
    const existingPenalty = await penaltyQuestRepo.findOne({
      where: {
        studentId: quest.studentId,
        campaignId: quest.campaignId,
        type: PenaltyType.MISSED_DAILY_QUEST,
        status: PenaltyStatus.PENDING,
      },
    });

    if (!existingPenalty) {
      // Issue penalty
      const penaltyDeadline = new Date();
      penaltyDeadline.setDate(penaltyDeadline.getDate() + 1);
      penaltyDeadline.setHours(23, 59, 59, 999);

      const penalty = penaltyQuestRepo.create({
        studentId: quest.studentId,
        campaignId: quest.campaignId,
        type: PenaltyType.MISSED_DAILY_QUEST,
        description: 'Failed to complete daily quest',
        penaltyTask: `Complete ${quest.totalHabits * 2} extra habits tomorrow to clear this penalty`,
        xpPenalty: quest.bonusXp,
        deadline: penaltyDeadline,
      });

      await penaltyQuestRepo.save(penalty);

      // Deduct XP
      const student = await studentRepo.findOne({ where: { id: parseInt(quest.studentId) } });
      if (student) {
        student.xp = Math.max(0, student.xp - penalty.xpPenalty);
        await studentRepo.save(student);
      }
    }
  }
};

// Generate random reward
const generateRandomReward = async (studentId: string) => {
  const rewardRepo = AppDataSource.getRepository(Reward);
  const studentRepo = AppDataSource.getRepository(Student);
  
  const rarityRoll = Math.random();
  let rarity: RewardRarity;
  let xpBonus = 0;
  let pointsBonus = 0;

  if (rarityRoll < 0.50) {
    rarity = RewardRarity.COMMON;
    xpBonus = 10;
    pointsBonus = 5;
  } else if (rarityRoll < 0.75) {
    rarity = RewardRarity.UNCOMMON;
    xpBonus = 25;
    pointsBonus = 15;
  } else if (rarityRoll < 0.90) {
    rarity = RewardRarity.RARE;
    xpBonus = 50;
    pointsBonus = 30;
  } else if (rarityRoll < 0.98) {
    rarity = RewardRarity.EPIC;
    xpBonus = 100;
    pointsBonus = 60;
  } else {
    rarity = RewardRarity.LEGENDARY;
    xpBonus = 250;
    pointsBonus = 150;
  }

  const rewardNames = {
    [RewardRarity.COMMON]: ['Bronze Chest', 'Small Potion', 'Habit Coin'],
    [RewardRarity.UNCOMMON]: ['Silver Chest', 'Medium Potion', 'Streak Token'],
    [RewardRarity.RARE]: ['Gold Chest', 'Large Potion', 'Power Crystal'],
    [RewardRarity.EPIC]: ['Platinum Chest', 'Mega Potion', 'Mystic Gem'],
    [RewardRarity.LEGENDARY]: ['Diamond Chest', 'Divine Elixir', 'Legendary Rune'],
  };

  const names = rewardNames[rarity];
  const name = names[Math.floor(Math.random() * names.length)];

  const reward = rewardRepo.create({
    studentId,
    type: RewardType.RANDOM_BOX,
    rarity,
    name,
    description: `You received a ${rarity.toLowerCase()} reward for completing your daily quest!`,
    xpBonus,
    pointsBonus,
  });

  await rewardRepo.save(reward);

  // Apply bonus XP only
  const student = await studentRepo.findOne({ where: { id: parseInt(studentId) } });
  if (student) {
    student.xp += xpBonus;
    await checkLevelUp(student);
    await studentRepo.save(student);
  }
};

// Check for level up
const checkLevelUp = async (student: Student) => {
  const achievementRepo = AppDataSource.getRepository(Achievement);
  
  const xpNeeded = student.level * 100;

  while (student.xp >= xpNeeded) {
    student.level += 1;

    // Check for rank promotion
    if (student.level === 10 && student.rank === 'E-Rank') {
      student.rank = 'D-Rank';
      await createAchievement(student.id.toString(), AchievementCategory.RANK, 'D-Rank Hunter', 'Promoted to D-Rank!', 100, 50);
    } else if (student.level === 20 && student.rank === 'D-Rank') {
      student.rank = 'C-Rank';
      await createAchievement(student.id.toString(), AchievementCategory.RANK, 'C-Rank Hunter', 'Promoted to C-Rank!', 200, 100);
    } else if (student.level === 30 && student.rank === 'C-Rank') {
      student.rank = 'B-Rank';
      await createAchievement(student.id.toString(), AchievementCategory.RANK, 'B-Rank Hunter', 'Promoted to B-Rank!', 400, 200);
    } else if (student.level === 40 && student.rank === 'B-Rank') {
      student.rank = 'A-Rank';
      await createAchievement(student.id.toString(), AchievementCategory.RANK, 'A-Rank Hunter', 'Promoted to A-Rank!', 800, 400);
    } else if (student.level === 50 && student.rank === 'A-Rank') {
      student.rank = 'S-Rank';
      await createAchievement(student.id.toString(), AchievementCategory.RANK, 'S-Rank Hunter', 'Promoted to S-Rank!', 1600, 800);
    }

    // Create level up achievement
    if (student.level % 10 === 0) {
      await createAchievement(
        student.id.toString(),
        AchievementCategory.LEVEL,
        `Level ${student.level} Achieved`,
        `You have reached level ${student.level}!`,
        student.level * 10,
        student.level * 5
      );
    }
  }
};

// Create achievement
const createAchievement = async (
  studentId: string,
  category: AchievementCategory,
  title: string,
  description: string,
  xpReward: number,
  pointsReward: number
) => {
  const achievementRepo = AppDataSource.getRepository(Achievement);
  const studentRepo = AppDataSource.getRepository(Student);
  
  const achievement = achievementRepo.create({
    studentId,
    category,
    title,
    description,
    xpReward,
    pointsReward,
  });

  await achievementRepo.save(achievement);

  // Award XP only
  const student = await studentRepo.findOne({ where: { id: parseInt(studentId) } });
  if (student) {
    student.xp += xpReward;
    await studentRepo.save(student);
  }
};

// Open a random box
export const openRandomBox = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.userId.toString();
    const { boxType } = req.body;

    const reward = await randomBoxService.openRandomBox(
      studentId,
      boxType || RewardType.RANDOM_BOX
    );

    res.json({
      success: true,
      data: reward,
      message: `🎉 You received: ${reward.name} (${reward.rarity})!`,
    });
  } catch (error: any) {
    console.error('Error opening random box:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// Check and grant achievements
export const checkAchievements = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.userId.toString();

    const newAchievements = await achievementService.checkAndGrantAchievements(studentId);

    res.json({
      success: true,
      data: newAchievements,
      message: newAchievements.length > 0
        ? `🏆 ${newAchievements.length} new achievement(s) unlocked!`
        : 'No new achievements',
    });
  } catch (error: any) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// Get achievement progress
export const getAchievementProgress = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.userId.toString();

    const progress = await achievementService.getAchievementProgress(studentId);

    res.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('Error fetching achievement progress:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// Get reward statistics
export const getRewardStats = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.userId.toString();

    const stats = await randomBoxService.getRewardStats(studentId);

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching reward stats:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
