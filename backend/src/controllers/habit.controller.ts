import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Habit } from '../entities/habit.entity';
import { HabitSubmission } from '../entities/habit-submission.entity';
import { Streak } from '../entities/streak.entity';
import { PointsLedger } from '../entities/points-ledger.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Student } from '../entities/student.entity';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';

export class HabitController {
    private habitRepository = AppDataSource.getRepository(Habit);
    private submissionRepository = AppDataSource.getRepository(HabitSubmission);
    private streakRepository = AppDataSource.getRepository(Streak);
    private pointsRepository = AppDataSource.getRepository(PointsLedger);
    private enrollmentRepository = AppDataSource.getRepository(Enrollment);
    private studentRepository = AppDataSource.getRepository(Student);

    getTodayHabits = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { campaignId } = req.params;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const student = await this.studentRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!student) {
                throw ApiError.notFound('Student profile not found');
            }

            // Check enrollment
            const enrollment = await this.enrollmentRepository.findOne({
                where: { studentId: student.id, campaignId: parseInt(campaignId) },
            });

            if (!enrollment) {
                throw ApiError.forbidden('Not enrolled in this campaign');
            }

            // Get campaign habits
            const habits = await this.habitRepository.find({
                where: { campaignId: parseInt(campaignId) },
                order: { sortOrder: 'ASC' },
            });

            // Check if already submitted today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todaySubmission = await this.submissionRepository.findOne({
                where: {
                    studentId: student.id,
                    campaignId: parseInt(campaignId),
                    submissionDate: today,
                },
            });

            // Get current streak
            const streak = await this.streakRepository.findOne({
                where: { studentId: student.id, campaignId: parseInt(campaignId) },
            });

            res.json({
                success: true,
                data: {
                    habits,
                    submittedToday: !!todaySubmission,
                    submission: todaySubmission,
                    streak: {
                        current: streak?.currentStreak || 0,
                        longest: streak?.longestStreak || 0,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    };

    submitHabits = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { campaignId } = req.params;
            const { rating } = req.body;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const student = await this.studentRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!student) {
                throw ApiError.notFound('Student profile not found');
            }

            // Check enrollment
            const enrollment = await this.enrollmentRepository.findOne({
                where: { studentId: student.id, campaignId: parseInt(campaignId) },
            });

            if (!enrollment) {
                throw ApiError.forbidden('Not enrolled in this campaign');
            }

            // Get today's date (midnight)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check if already submitted today
            const existingSubmission = await this.submissionRepository.findOne({
                where: {
                    studentId: student.id,
                    campaignId: parseInt(campaignId),
                    submissionDate: today,
                },
            });

            if (existingSubmission) {
                throw ApiError.conflict('Already submitted habits for today');
            }

            // Create submission
            const submission = this.submissionRepository.create({
                studentId: student.id,
                campaignId: parseInt(campaignId),
                submissionDate: today,
                rating: rating || null,
                completed: true
            });
            await this.submissionRepository.save(submission);

            // Update streak
            let streak = await this.streakRepository.findOne({
                where: { studentId: student.id, campaignId: parseInt(campaignId) },
            });

            if (!streak) {
                streak = this.streakRepository.create({
                    studentId: student.id,
                    campaignId: parseInt(campaignId),
                    currentStreak: 0,
                    longestStreak: 0,
                });
            }

            // Check if continuing streak (last submission was yesterday)
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (
                streak.lastSubmissionDate &&
                new Date(streak.lastSubmissionDate).getTime() === yesterday.getTime()
            ) {
                // Continue streak
                streak.currentStreak += 1;
            } else if (
                !streak.lastSubmissionDate ||
                new Date(streak.lastSubmissionDate).getTime() < yesterday.getTime()
            ) {
                // Start new streak
                streak.currentStreak = 1;
            }

            // Update longest streak
            if (streak.currentStreak > streak.longestStreak) {
                streak.longestStreak = streak.currentStreak;
            }

            streak.lastSubmissionDate = today;
            await this.streakRepository.save(streak);

            // Calculate points
            const streakMultiplier = this.getStreakMultiplier(streak.currentStreak);
            const bonusMultiplier = 1.0; // TODO: Implement lottery
            const basePoints = 10;
            const totalPoints = Math.floor(basePoints * streakMultiplier * bonusMultiplier);

            // Create points ledger entry
            const pointsEntry = this.pointsRepository.create({
                studentId: student.id,
                campaignId: parseInt(campaignId),
                submissionId: submission.id,
                submissionDate: today,
                basePoints,
                streakMultiplier,
                bonusMultiplier,
                totalPoints,
            });
            await this.pointsRepository.save(pointsEntry);

            res.status(201).json({
                success: true,
                message: 'Habits submitted successfully!',
                data: {
                    submission,
                    streak: {
                        current: streak.currentStreak,
                        longest: streak.longestStreak,
                    },
                    points: {
                        base: basePoints,
                        streakMultiplier,
                        bonusMultiplier,
                        total: totalPoints,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getSubmissionHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { campaignId } = req.params;
            const { limit = 30 } = req.query;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const student = await this.studentRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!student) {
                throw ApiError.notFound('Student profile not found');
            }

            const submissions = await this.submissionRepository.find({
                where: { studentId: student.id, campaignId: parseInt(campaignId) },
                order: { submissionDate: 'DESC' },
                take: parseInt(limit as string),
            });

            const points = await this.pointsRepository.find({
                where: { studentId: student.id, campaignId: parseInt(campaignId) },
                order: { submissionDate: 'DESC' },
                take: parseInt(limit as string),
            });

            res.json({
                success: true,
                data: {
                    submissions,
                    points,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getStreak = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { campaignId } = req.params;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const student = await this.studentRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!student) {
                throw ApiError.notFound('Student profile not found');
            }

            const streak = await this.streakRepository.findOne({
                where: { studentId: student.id, campaignId: parseInt(campaignId) },
            });

            // Get total points for campaign
            const totalPoints = await this.pointsRepository
                .createQueryBuilder('points')
                .select('SUM(points.totalPoints)', 'total')
                .where('points.studentId = :studentId', { studentId: student.id })
                .andWhere('points.campaignId = :campaignId', { campaignId: parseInt(campaignId) })
                .getRawOne();

            res.json({
                success: true,
                data: {
                    currentStreak: streak?.currentStreak || 0,
                    longestStreak: streak?.longestStreak || 0,
                    lastSubmission: streak?.lastSubmissionDate,
                    totalPoints: parseInt(totalPoints?.total || '0'),
                },
            });
        } catch (error) {
            next(error);
        }
    };

    private getStreakMultiplier(streakDays: number): number {
        if (streakDays >= 30) return 2.0;
        if (streakDays >= 7) return 1.5;
        if (streakDays >= 3) return 1.2;
        return 1.0;
    }
}
