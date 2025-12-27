import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Student } from '../entities/student.entity';
import { Admin } from '../entities/admin.entity';
import { Sponsor } from '../entities/sponsor.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Campaign } from '../entities/campaign.entity';
import { Streak } from '../entities/streak.entity';
import { PointsLedger } from '../entities/points-ledger.entity';
import { Badge } from '../entities/badge.entity';
import { SponsorPledge } from '../entities/sponsor-pledge.entity';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';

export class DashboardController {
    private studentRepository = AppDataSource.getRepository(Student);
    private adminRepository = AppDataSource.getRepository(Admin);
    private sponsorRepository = AppDataSource.getRepository(Sponsor);
    private enrollmentRepository = AppDataSource.getRepository(Enrollment);
    private campaignRepository = AppDataSource.getRepository(Campaign);
    private streakRepository = AppDataSource.getRepository(Streak);
    private pointsRepository = AppDataSource.getRepository(PointsLedger);
    private badgeRepository = AppDataSource.getRepository(Badge);
    private pledgeRepository = AppDataSource.getRepository(SponsorPledge);

    // ==================== STUDENT DASHBOARD ====================

    getStudentDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const student = await this.studentRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!student) {
                throw ApiError.notFound('Student profile not found');
            }

            // Get enrolled campaigns
            const enrollments = await this.enrollmentRepository.find({
                where: { studentId: student.id },
                relations: ['campaign', 'campaign.habits'],
            });

            // Get total points
            const totalPoints = await this.pointsRepository
                .createQueryBuilder('points')
                .select('SUM(points.totalPoints)', 'total')
                .where('points.studentId = :studentId', { studentId: student.id })
                .getRawOne();

            // Get streaks
            const streaks = await this.streakRepository.find({
                where: { studentId: student.id },
            });

            // Get badges
            const badges = await this.badgeRepository.find({
                where: { studentId: student.id },
            });

            res.json({
                success: true,
                data: {
                    student: {
                        id: student.id,
                        displayName: student.displayName,
                        age: student.age,
                        avatarUrl: student.avatarUrl,
                    },
                    enrolledCampaigns: enrollments.map((e) => ({
                        ...e.campaign,
                        streak: streaks.find((s) => s.campaignId === e.campaignId),
                    })),
                    totalPoints: parseInt(totalPoints?.total || '0'),
                    badges,
                    stats: {
                        activeCampaigns: enrollments.filter((e) => e.campaign?.status === 'active').length,
                        longestStreak: Math.max(...streaks.map((s) => s.longestStreak), 0),
                        totalBadges: badges.length,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getStudentCampaigns = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const student = await this.studentRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!student) {
                throw ApiError.notFound('Student profile not found');
            }

            const enrollments = await this.enrollmentRepository.find({
                where: { studentId: student.id },
                relations: ['campaign', 'campaign.habits'],
            });

            const campaignsWithStats = await Promise.all(
                enrollments.map(async (enrollment) => {
                    const streak = await this.streakRepository.findOne({
                        where: { studentId: student.id, campaignId: enrollment.campaignId },
                    });

                    const points = await this.pointsRepository
                        .createQueryBuilder('points')
                        .select('SUM(points.totalPoints)', 'total')
                        .where('points.studentId = :studentId', { studentId: student.id })
                        .andWhere('points.campaignId = :campaignId', { campaignId: enrollment.campaignId })
                        .getRawOne();

                    return {
                        ...enrollment.campaign,
                        enrolledAt: enrollment.enrolledAt,
                        streak: streak?.currentStreak || 0,
                        longestStreak: streak?.longestStreak || 0,
                        totalPoints: parseInt(points?.total || '0'),
                    };
                })
            );

            res.json({
                success: true,
                data: campaignsWithStats,
            });
        } catch (error) {
            next(error);
        }
    };

    getStudentStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const student = await this.studentRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!student) {
                throw ApiError.notFound('Student profile not found');
            }

            // Get all points history
            const pointsHistory = await this.pointsRepository.find({
                where: { studentId: student.id },
                order: { submissionDate: 'ASC' },
            });

            // Get completion rate (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentSubmissions = pointsHistory.filter(
                (p) => new Date(p.submissionDate) >= thirtyDaysAgo
            );

            res.json({
                success: true,
                data: {
                    pointsHistory: pointsHistory.slice(-30), // Last 30 entries
                    recentSubmissions: recentSubmissions.length,
                    totalDays: pointsHistory.length,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getStudentBadges = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const student = await this.studentRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!student) {
                throw ApiError.notFound('Student profile not found');
            }

            const badges = await this.badgeRepository.find({
                where: { studentId: student.id },
                relations: ['campaign'],
                order: { earnedAt: 'DESC' },
            });

            res.json({
                success: true,
                data: badges,
            });
        } catch (error) {
            next(error);
        }
    };

    // ==================== ADMIN DASHBOARD ====================

    getAdminDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const admin = await this.adminRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!admin) {
                throw ApiError.notFound('Admin profile not found');
            }

            // Get managed campaigns
            const campaigns = await this.campaignRepository.find({
                where: { adminId: admin.id },
                relations: ['habits'],
            });

            // Get stats for each campaign
            const campaignStats = await Promise.all(
                campaigns.map(async (campaign) => {
                    const enrollmentCount = await this.enrollmentRepository.count({
                        where: { campaignId: campaign.id },
                    });

                    const totalPoints = await this.pointsRepository
                        .createQueryBuilder('points')
                        .select('SUM(points.totalPoints)', 'total')
                        .where('points.campaignId = :campaignId', { campaignId: campaign.id })
                        .getRawOne();

                    // Get sponsors
                    const pledges = await this.pledgeRepository.find({
                        where: { campaignId: campaign.id },
                        relations: ['sponsor']
                    });

                    const sponsors = pledges.map(p => ({
                        name: p.sponsor.name,
                        amountPledged: p.capAmount || 'Unlimited',
                        ratePerPoint: p.ratePerPoint,
                        status: p.status
                    }));

                    return {
                        ...campaign,
                        enrollmentCount,
                        totalPoints: parseInt(totalPoints?.total || '0'),
                        sponsors
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    admin: {
                        id: admin.id,
                        name: admin.name,
                        organization: admin.organization,
                    },
                    campaigns: campaignStats,
                    stats: {
                        totalCampaigns: campaigns.length,
                        activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
                        totalEnrollments: campaignStats.reduce((sum, c) => sum + c.enrollmentCount, 0),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getAdminCampaigns = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const admin = await this.adminRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!admin) {
                throw ApiError.notFound('Admin profile not found');
            }

            const campaigns = await this.campaignRepository.find({
                where: { adminId: admin.id },
                relations: ['habits'],
                order: { createdAt: 'DESC' },
            });

            res.json({
                success: true,
                data: campaigns,
            });
        } catch (error) {
            next(error);
        }
    };

    getAdminStudents = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { campaignId } = req.query;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const admin = await this.adminRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!admin) {
                throw ApiError.notFound('Admin profile not found');
            }

            // Get admin's campaigns
            const adminCampaigns = await this.campaignRepository.find({
                where: { adminId: admin.id },
            });

            const campaignIds = campaignId
                ? [parseInt(campaignId as string)]
                : adminCampaigns.map((c) => c.id);

            // Get enrollments for these campaigns
            const enrollments = await this.enrollmentRepository
                .createQueryBuilder('enrollment')
                .leftJoinAndSelect('enrollment.student', 'student')
                .leftJoinAndSelect('enrollment.campaign', 'campaign')
                .where('enrollment.campaignId IN (:...campaignIds)', { campaignIds })
                .getMany();

            // Get streaks for students
            const studentsWithStats = await Promise.all(
                enrollments.map(async (enrollment) => {
                    const streak = await this.streakRepository.findOne({
                        where: { studentId: enrollment.studentId, campaignId: enrollment.campaignId },
                    });

                    const points = await this.pointsRepository
                        .createQueryBuilder('points')
                        .select('SUM(points.totalPoints)', 'total')
                        .where('points.studentId = :studentId', { studentId: enrollment.studentId })
                        .andWhere('points.campaignId = :campaignId', { campaignId: enrollment.campaignId })
                        .getRawOne();

                    return {
                        student: enrollment.student,
                        campaign: enrollment.campaign,
                        enrolledAt: enrollment.enrolledAt,
                        streak: streak?.currentStreak || 0,
                        totalPoints: parseInt(points?.total || '0'),
                    };
                })
            );

            res.json({
                success: true,
                data: studentsWithStats,
            });
        } catch (error) {
            next(error);
        }
    };

    // ==================== SPONSOR DASHBOARD ====================

    getSponsorDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const sponsor = await this.sponsorRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!sponsor) {
                throw ApiError.notFound('Sponsor profile not found');
            }

            const pledges = await this.pledgeRepository.find({
                where: { sponsorId: sponsor.id },
                relations: ['campaign'],
            });

            // Calculate projected donations
            const pledgeStats = await Promise.all(
                pledges.map(async (pledge) => {
                    const totalPoints = await this.pointsRepository
                        .createQueryBuilder('points')
                        .select('SUM(points.totalPoints)', 'total')
                        .where('points.campaignId = :campaignId', { campaignId: pledge.campaignId })
                        .getRawOne();

                    const points = parseInt(totalPoints?.total || '0');
                    const projectedAmount = Math.min(
                        points * Number(pledge.ratePerPoint),
                        pledge.capAmount || Infinity
                    );

                    return {
                        ...pledge,
                        totalCampaignPoints: points,
                        projectedAmount,
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    sponsor: {
                        id: sponsor.id,
                        name: sponsor.name,
                        totalDonated: sponsor.totalDonated,
                    },
                    pledges: pledgeStats,
                    stats: {
                        totalPledges: pledges.length,
                        activePledges: pledges.filter((p) => p.status === 'active').length,
                        totalProjectedDonation: pledgeStats.reduce((sum, p) => sum + p.projectedAmount, 0),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getSponsorPledges = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const sponsor = await this.sponsorRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!sponsor) {
                throw ApiError.notFound('Sponsor profile not found');
            }

            const pledges = await this.pledgeRepository.find({
                where: { sponsorId: sponsor.id },
                relations: ['campaign'],
                order: { pledgedAt: 'DESC' },
            });

            res.json({
                success: true,
                data: pledges,
            });
        } catch (error) {
            next(error);
        }
    };

    getSponsorImpact = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const sponsor = await this.sponsorRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!sponsor) {
                throw ApiError.notFound('Sponsor profile not found');
            }

            const pledges = await this.pledgeRepository.find({
                where: { sponsorId: sponsor.id },
                relations: ['campaign'],
            });

            // Calculate impact stats
            let totalStudentsSupported = 0;
            let totalPointsGenerated = 0;

            for (const pledge of pledges) {
                const enrollmentCount = await this.enrollmentRepository.count({
                    where: { campaignId: pledge.campaignId },
                });

                const points = await this.pointsRepository
                    .createQueryBuilder('points')
                    .select('SUM(points.totalPoints)', 'total')
                    .where('points.campaignId = :campaignId', { campaignId: pledge.campaignId })
                    .getRawOne();

                totalStudentsSupported += enrollmentCount;
                totalPointsGenerated += parseInt(points?.total || '0');
            }

            res.json({
                success: true,
                data: {
                    totalDonated: sponsor.totalDonated,
                    totalStudentsSupported,
                    totalPointsGenerated,
                    campaignsSupported: pledges.length,
                },
            });
        } catch (error) {
            next(error);
        }
    };
}
