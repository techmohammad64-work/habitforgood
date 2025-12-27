import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Campaign } from '../entities/campaign.entity';
import { Habit } from '../entities/habit.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Streak } from '../entities/streak.entity';
import { PointsLedger } from '../entities/points-ledger.entity';
import { Admin } from '../entities/admin.entity';
import { Student } from '../entities/student.entity';
import { SponsorPledge } from '../entities/sponsor-pledge.entity';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';

export class CampaignController {
    private campaignRepository = AppDataSource.getRepository(Campaign);
    private habitRepository = AppDataSource.getRepository(Habit);
    private enrollmentRepository = AppDataSource.getRepository(Enrollment);
    private streakRepository = AppDataSource.getRepository(Streak);
    private pointsRepository = AppDataSource.getRepository(PointsLedger);
    private adminRepository = AppDataSource.getRepository(Admin);
    private studentRepository = AppDataSource.getRepository(Student);
    private pledgeRepository = AppDataSource.getRepository(SponsorPledge);

    getAllCampaigns = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status, category, featured } = req.query;

            const queryBuilder = this.campaignRepository
                .createQueryBuilder('campaign')
                .leftJoinAndSelect('campaign.habits', 'habits')
                .leftJoinAndSelect('campaign.admin', 'admin')
                .orderBy('campaign.createdAt', 'DESC');

            if (status) {
                queryBuilder.andWhere('campaign.status = :status', { status });
            }

            if (category) {
                queryBuilder.andWhere(':category = ANY(campaign.categoryTags)', { category });
            }

            if (featured === 'true') {
                queryBuilder.andWhere('campaign.featured = true');
            }

            const campaigns = await queryBuilder.getMany();

            // Get enrollment counts and sponsor status
            const campaignsWithCounts = await Promise.all(
                campaigns.map(async (campaign) => {
                    const enrollmentCount = await this.enrollmentRepository.count({
                        where: { campaignId: campaign.id },
                    });

                    const sponsorCount = await this.pledgeRepository.count({
                        where: { campaignId: campaign.id, status: 'active' }
                    });

                    return {
                        ...campaign,
                        enrollmentCount,
                        isSponsored: sponsorCount > 0
                    };
                })
            );

            res.json({
                success: true,
                data: campaignsWithCounts,
            });
        } catch (error) {
            next(error);
        }
    };

    getFeaturedCampaigns = async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const campaigns = await this.campaignRepository.find({
                where: { featured: true, status: 'active' },
                relations: ['habits', 'admin'],
                take: 5,
            });

            res.json({
                success: true,
                data: campaigns,
            });
        } catch (error) {
            next(error);
        }
    };

    getCampaignById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const campaign = await this.campaignRepository.findOne({
                where: { id: parseInt(id) },
                relations: ['habits', 'admin', 'cause'],
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found');
            }

            const enrollmentCount = await this.enrollmentRepository.count({
                where: { campaignId: parseInt(id) },
            });

            const totalPoints = await this.pointsRepository
                .createQueryBuilder('points')
                .select('SUM(points.totalPoints)', 'total')
                .where('points.campaignId = :id', { id })
                .getRawOne();

            // Fetch sponsors with details
            const pledges = await this.pledgeRepository.find({
                where: { campaignId: parseInt(id) },
                relations: ['sponsor', 'sponsor.user']
            });

            const sponsors = pledges.map(pledge => ({
                name: pledge.sponsor.name,
                email: pledge.sponsor.user.email,
                ratePerPoint: pledge.ratePerPoint,
                capAmount: pledge.capAmount,
                message: pledge.message,
                adImageUrl: pledge.adImageUrl,
                status: pledge.status,
                totalDonated: pledge.sponsor.totalDonated
            }));

            res.json({
                success: true,
                data: {
                    ...campaign,
                    enrollmentCount,
                    totalPoints: parseInt(totalPoints?.total || '0'),
                    sponsors
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const leaderboard = await this.streakRepository
                .createQueryBuilder('streak')
                .leftJoinAndSelect('streak.student', 'student')
                .where('streak.campaignId = :id', { id: parseInt(id) })
                .orderBy('streak.currentStreak', 'DESC')
                .take(10)
                .getMany();

            const leaderboardData = leaderboard.map((entry, index) => ({
                rank: index + 1,
                studentId: entry.studentId,
                displayName: entry.student?.anonymousMode
                    ? `Anonymous #${entry.studentId.toString().slice(-4)}`
                    : entry.student?.displayName,
                currentStreak: entry.currentStreak,
                longestStreak: entry.longestStreak,
            }));

            res.json({
                success: true,
                data: leaderboardData,
            });
        } catch (error) {
            next(error);
        }
    };

    getActiveAd = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            // Get active pledges with ads
            const pledges = await this.pledgeRepository.find({
                where: {
                    campaignId: parseInt(id),
                    // status: 'active' // status is string 'active'
                },
                relations: ['sponsor']
            });

            // Filter for active pledges with messages
            const activeAds = pledges.filter(p => p.status === 'active' && p.message);

            if (activeAds.length === 0) {
                res.json({ success: true, data: null });
                return;
            }

            // Pick random ad
            const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];

            res.json({
                success: true,
                data: {
                    sponsorName: randomAd.sponsor.name,
                    message: randomAd.message,
                    adImageUrl: randomAd.adImageUrl
                }
            });
        } catch (error) {
            next(error);
        }
    };

    enrollInCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            // Get student
            const student = await this.studentRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!student) {
                throw ApiError.notFound('Student profile not found');
            }

            // Check campaign exists and is active
            const campaign = await this.campaignRepository.findOne({
                where: { id: parseInt(id) },
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found');
            }

            if (campaign.status !== 'active') {
                throw ApiError.badRequest('Campaign is not active');
            }

            // Check if already enrolled
            const existingEnrollment = await this.enrollmentRepository.findOne({
                where: { studentId: student.id, campaignId: parseInt(id) },
            });

            if (existingEnrollment) {
                throw ApiError.conflict('Already enrolled in this campaign');
            }

            // Check max enrollments (5)
            const enrollmentCount = await this.enrollmentRepository.count({
                where: { studentId: student.id },
            });

            if (enrollmentCount >= 5) {
                throw ApiError.badRequest('Maximum of 5 active campaigns allowed');
            }

            // Create enrollment
            const enrollment = this.enrollmentRepository.create({
                studentId: student.id,
                campaignId: parseInt(id),
            });
            await this.enrollmentRepository.save(enrollment);

            // Initialize streak
            const streak = this.streakRepository.create({
                studentId: student.id,
                campaignId: parseInt(id),
                currentStreak: 0,
                longestStreak: 0,
            });
            await this.streakRepository.save(streak);

            res.status(201).json({
                success: true,
                message: 'Successfully enrolled in campaign',
                data: enrollment,
            });
        } catch (error) {
            next(error);
        }
    };

    unenrollFromCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const student = await this.studentRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!student) {
                throw ApiError.notFound('Student profile not found');
            }

            const enrollment = await this.enrollmentRepository.findOne({
                where: { studentId: student.id, campaignId: parseInt(id) },
            });

            if (!enrollment) {
                throw ApiError.notFound('Enrollment not found');
            }

            await this.enrollmentRepository.remove(enrollment);

            res.json({
                success: true,
                message: 'Successfully unenrolled from campaign',
            });
        } catch (error) {
            next(error);
        }
    };

    createCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

            const {
                title,
                description,
                categoryTags,
                goalAmount,
                startDate,
                endDate,
                imageUrl,
                habits,
            } = req.body;

            if (!title || !startDate || !endDate) {
                throw ApiError.badRequest('Title, start date, and end date are required');
            }

            // Validate dates
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (end <= start) {
                throw ApiError.badRequest('End date must be after start date');
            }

            // Determine initial status
            const now = new Date();
            const status = start <= now ? 'active' : 'upcoming';

            // Create campaign
            const campaign = this.campaignRepository.create({
                adminId: admin.id,
                title,
                description,
                categoryTags: categoryTags || [],
                goalAmount,
                startDate: start,
                endDate: end,
                status,
                imageUrl,
            });
            await this.campaignRepository.save(campaign);

            // Create habits if provided
            if (habits && Array.isArray(habits)) {
                for (let i = 0; i < habits.length; i++) {
                    const habit = this.habitRepository.create({
                        campaignId: campaign.id,
                        name: habits[i].name,
                        description: habits[i].description,
                        icon: habits[i].icon || 'star',
                        frequency: habits[i].frequency || 'daily',
                        sortOrder: i,
                    });
                    await this.habitRepository.save(habit);
                }
            }

            // Reload with habits
            const savedCampaign = await this.campaignRepository.findOne({
                where: { id: campaign.id },
                relations: ['habits'],
            });

            res.status(201).json({
                success: true,
                data: savedCampaign,
            });
        } catch (error) {
            next(error);
        }
    };

    updateCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const admin = await this.adminRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!admin) {
                throw ApiError.notFound('Admin profile not found');
            }

            const campaign = await this.campaignRepository.findOne({
                where: { id: parseInt(id), adminId: admin.id },
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found or not authorized');
            }

            const { title, description, categoryTags, goalAmount, startDate, endDate, imageUrl, habits } = req.body;

            if (title) campaign.title = title;
            if (description !== undefined) campaign.description = description;
            if (categoryTags) campaign.categoryTags = categoryTags;
            if (goalAmount !== undefined) campaign.goalAmount = goalAmount;
            if (startDate) campaign.startDate = new Date(startDate);
            if (endDate) campaign.endDate = new Date(endDate);
            if (imageUrl !== undefined) campaign.imageUrl = imageUrl;

            // Recalculate status if dates changed and not paused
            if ((startDate || endDate) && campaign.status !== 'paused') {
                const now = new Date();
                const start = campaign.startDate;
                const end = campaign.endDate;

                if (now < start) {
                    campaign.status = 'upcoming';
                } else if (now > end) {
                    campaign.status = 'ended';
                } else {
                    campaign.status = 'active';
                }
            }

            // Handle habits update
            if (habits && Array.isArray(habits)) {
                // Get existing habits
                const existingHabits = await this.habitRepository.find({ where: { campaignId: parseInt(id) } });
                const existingHabitIds = existingHabits.map(h => h.id);
                const incomingHabitIds = habits.filter(h => h.id).map(h => h.id); // Assuming string/number ID

                // Update or Create
                for (let i = 0; i < habits.length; i++) {
                    const hData = habits[i];
                    if (hData.id && existingHabitIds.find(eid => eid.toString() === hData.id.toString())) {
                        await this.habitRepository.update(hData.id, {
                            name: hData.name,
                            description: hData.description,
                            icon: hData.icon,
                            frequency: hData.frequency,
                            sortOrder: i
                        });
                    } else {
                        const newHabit = this.habitRepository.create({
                            campaignId: parseInt(id),
                            name: hData.name,
                            description: hData.description,
                            icon: hData.icon || 'star',
                            frequency: hData.frequency || 'daily',
                            sortOrder: i
                        });
                        await this.habitRepository.save(newHabit);
                    }
                }

                // Optional: Delete habits not in the list?
                // For now, let's just update/add to be safe and simple.
            }

            await this.campaignRepository.save(campaign);

            res.json({
                success: true,
                data: campaign,
            });
        } catch (error) {
            next(error);
        }
    };

    pauseCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const admin = await this.adminRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!admin) {
                throw ApiError.notFound('Admin profile not found');
            }

            const campaign = await this.campaignRepository.findOne({
                where: { id: parseInt(id), adminId: admin.id },
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found or not authorized');
            }

            campaign.status = 'paused';
            await this.campaignRepository.save(campaign);

            res.json({
                success: true,
                message: 'Campaign paused',
                data: campaign,
            });
        } catch (error) {
            next(error);
        }
    };

    resumeCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const admin = await this.adminRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!admin) {
                throw ApiError.notFound('Admin profile not found');
            }

            const campaign = await this.campaignRepository.findOne({
                where: { id: parseInt(id), adminId: admin.id },
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found or not authorized');
            }

            campaign.status = 'active';
            await this.campaignRepository.save(campaign);

            res.json({
                success: true,
                message: 'Campaign resumed',
                data: campaign,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteCampaign = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const admin = await this.adminRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!admin) {
                throw ApiError.notFound('Admin profile not found');
            }

            const campaign = await this.campaignRepository.findOne({
                where: { id: parseInt(id), adminId: admin.id },
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found or not authorized');
            }

            // Check if has enrollments
            const enrollmentCount = await this.enrollmentRepository.count({
                where: { campaignId: parseInt(id) },
            });

            if (enrollmentCount > 0) {
                throw ApiError.badRequest('Cannot delete campaign with enrolled students');
            }

            await this.campaignRepository.remove(campaign);

            res.json({
                success: true,
                message: 'Campaign deleted',
            });
        } catch (error) {
            next(error);
        }
    };

    addHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { name, description, icon, frequency } = req.body;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const admin = await this.adminRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!admin) {
                throw ApiError.notFound('Admin profile not found');
            }

            const campaign = await this.campaignRepository.findOne({
                where: { id: parseInt(id), adminId: admin.id },
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found or not authorized');
            }

            const habitCount = await this.habitRepository.count({
                where: { campaignId: parseInt(id) },
            });

            const habit = this.habitRepository.create({
                campaignId: parseInt(id),
                name,
                description,
                icon: icon || 'star',
                frequency: frequency || 'daily',
                sortOrder: habitCount,
            });
            await this.habitRepository.save(habit);

            res.status(201).json({
                success: true,
                data: habit,
            });
        } catch (error) {
            next(error);
        }
    };

    updateHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id, habitId } = req.params;
            const { name, description, icon, frequency } = req.body;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const admin = await this.adminRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!admin) {
                throw ApiError.notFound('Admin profile not found');
            }

            const campaign = await this.campaignRepository.findOne({
                where: { id: parseInt(id), adminId: admin.id },
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found or not authorized');
            }

            const habit = await this.habitRepository.findOne({
                where: { id: parseInt(habitId), campaignId: parseInt(id) },
            });

            if (!habit) {
                throw ApiError.notFound('Habit not found');
            }

            if (name) habit.name = name;
            if (description !== undefined) habit.description = description;
            if (icon) habit.icon = icon;
            if (frequency) habit.frequency = frequency;

            await this.habitRepository.save(habit);

            res.json({
                success: true,
                data: habit,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteHabit = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id, habitId } = req.params;

            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const admin = await this.adminRepository.findOne({
                where: { userId: req.user.id },
            });

            if (!admin) {
                throw ApiError.notFound('Admin profile not found');
            }

            const campaign = await this.campaignRepository.findOne({
                where: { id: parseInt(id), adminId: admin.id },
            });

            if (!campaign) {
                throw ApiError.notFound('Campaign not found or not authorized');
            }

            const habit = await this.habitRepository.findOne({
                where: { id: parseInt(habitId), campaignId: parseInt(id) },
            });

            if (!habit) {
                throw ApiError.notFound('Habit not found');
            }

            await this.habitRepository.remove(habit);

            res.json({
                success: true,
                message: 'Habit deleted',
            });
        } catch (error) {
            next(error);
        }
    };
}
