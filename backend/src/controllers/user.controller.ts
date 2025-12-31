import { Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Admin } from '../entities/admin.entity';
import { Sponsor } from '../entities/sponsor.entity';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';

export class UserController {
    private userRepository = AppDataSource.getRepository(User);
    private studentRepository = AppDataSource.getRepository(Student);
    private adminRepository = AppDataSource.getRepository(Admin);
    private sponsorRepository = AppDataSource.getRepository(Sponsor);

    getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const user = await this.userRepository.findOne({
                where: { id: req.user.id },
            });

            if (!user) {
                throw ApiError.notFound('User not found');
            }

            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    emailVerified: user.emailVerified,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getProfileDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const user = await this.userRepository.findOne({
                where: { id: req.user.id },
            });

            if (!user) {
                throw ApiError.notFound('User not found');
            }

            let profile = null;

            switch (user.role) {
                case 'student':
                    profile = await this.studentRepository.findOne({
                        where: { userId: user.id },
                    });
                    break;
                case 'admin':
                    profile = await this.adminRepository.findOne({
                        where: { userId: user.id },
                    });
                    break;
                case 'sponsor':
                    profile = await this.sponsorRepository.findOne({
                        where: { userId: user.id },
                    });
                    break;
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    },
                    profile,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const user = await this.userRepository.findOne({
                where: { id: req.user.id },
            });

            if (!user) {
                throw ApiError.notFound('User not found');
            }

            const { displayName, avatarUrl, name, organization } = req.body;

            switch (user.role) {
                case 'student': {
                    const student = await this.studentRepository.findOne({
                        where: { userId: user.id },
                    });
                    if (student) {
                        if (displayName) student.displayName = displayName;
                        if (avatarUrl !== undefined) student.avatarUrl = avatarUrl;
                        await this.studentRepository.save(student);
                    }
                    break;
                }
                case 'admin': {
                    const admin = await this.adminRepository.findOne({
                        where: { userId: user.id },
                    });
                    if (admin) {
                        if (name) admin.name = name;
                        if (organization !== undefined) admin.organization = organization;
                        await this.adminRepository.save(admin);
                    }
                    break;
                }
                case 'sponsor': {
                    const sponsor = await this.sponsorRepository.findOne({
                        where: { userId: user.id },
                    });
                    if (sponsor) {
                        if (name) sponsor.name = name;
                        await this.sponsorRepository.save(sponsor);
                    }
                    break;
                }
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    updatePreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            const { timezone, emailNotificationsEnabled } = req.body;

            const user = await this.userRepository.findOne({
                where: { id: req.user.id }
            });

            if (!user) {
                throw ApiError.notFound('User not found');
            }

            if (timezone !== undefined) user.timezone = timezone;
            if (emailNotificationsEnabled !== undefined) user.emailNotificationsEnabled = emailNotificationsEnabled;

            await this.userRepository.save(user);

            res.json({
                success: true,
                message: 'Preferences updated successfully',
                data: {
                    timezone: user.timezone,
                    emailNotificationsEnabled: user.emailNotificationsEnabled
                }
            });
        } catch (error) {
            next(error);
        }
    };
}
