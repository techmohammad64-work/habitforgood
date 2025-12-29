import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Admin } from '../entities/admin.entity';
import { Sponsor } from '../entities/sponsor.entity';
import { ApiError } from '../middleware/error.middleware';
import { HabitSubmission } from '../entities/habit-submission.entity';
import { Streak } from '../entities/streak.entity';
import { PointsLedger } from '../entities/points-ledger.entity';

export class AuthController {
    private userRepository = AppDataSource.getRepository(User);
    private studentRepository = AppDataSource.getRepository(Student);
    private adminRepository = AppDataSource.getRepository(Admin);
    private sponsorRepository = AppDataSource.getRepository(Sponsor);

    registerStudent = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, displayName, age, parentEmail } = req.body;

            // Validate required fields
            if (!email || !password || !displayName || !age || !parentEmail) {
                throw ApiError.badRequest('All fields are required');
            }

            // Validate age (5-8)
            if (age < 5 || age > 8) {
                throw ApiError.badRequest('Age must be between 5 and 8');
            }

            // Check if user exists
            const existingUser = await this.userRepository.findOne({ where: { email } });
            if (existingUser) {
                throw ApiError.conflict('Email already registered');
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const user = this.userRepository.create({
                email,
                passwordHash,
                role: 'student',
                emailVerified: false,
            });
            await this.userRepository.save(user);

            // Create student profile
            const student = this.studentRepository.create({
                userId: user.id,
                displayName,
                age,
                parentEmail,
                anonymousMode: false,
            });
            await this.studentRepository.save(student);

            // Generate token
            const token = this.generateToken(user);

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    },
                    student: {
                        id: student.id,
                        displayName: student.displayName,
                        age: student.age,
                    },
                    token,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, name, organization, roleTitle } = req.body;

            if (!email || !password || !name) {
                throw ApiError.badRequest('Email, password, and name are required');
            }

            const existingUser = await this.userRepository.findOne({ where: { email } });
            if (existingUser) {
                throw ApiError.conflict('Email already registered');
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const user = this.userRepository.create({
                email,
                passwordHash,
                role: 'admin',
                emailVerified: false,
            });
            await this.userRepository.save(user);

            const admin = this.adminRepository.create({
                userId: user.id,
                name,
                organization,
                roleTitle,
                verified: false,
            });
            await this.adminRepository.save(admin);

            const token = this.generateToken(user);

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    },
                    admin: {
                        id: admin.id,
                        name: admin.name,
                        organization: admin.organization,
                    },
                    token,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    registerSponsor = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, name } = req.body;

            if (!email || !password || !name) {
                throw ApiError.badRequest('Email, password, and name are required');
            }

            const existingUser = await this.userRepository.findOne({ where: { email } });
            if (existingUser) {
                throw ApiError.conflict('Email already registered');
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const user = this.userRepository.create({
                email,
                passwordHash,
                role: 'sponsor',
                emailVerified: false,
            });
            await this.userRepository.save(user);

            const sponsor = this.sponsorRepository.create({
                userId: user.id,
                name,
                totalDonated: 0,
            });
            await this.sponsorRepository.save(sponsor);

            const token = this.generateToken(user);

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    },
                    sponsor: {
                        id: sponsor.id,
                        name: sponsor.name,
                    },
                    token,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw ApiError.badRequest('Email and password are required');
            }

            const user = await this.userRepository.findOne({ where: { email } });
            if (!user) {
                throw ApiError.unauthorized('Invalid credentials');
            }

            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                throw ApiError.unauthorized('Invalid credentials');
            }

            const token = this.generateToken(user);

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    },
                    token,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    logout = async (_req: Request, res: Response) => {
        // JWT is stateless, so logout is handled client-side
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    };

    verifyToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw ApiError.unauthorized('No token provided');
            }

            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'dev-secret-key';
            const decoded = jwt.verify(token, secret) as { id: number };
            const userId = decoded.id;

            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw ApiError.unauthorized('Invalid token');
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    };

    handleEmailSubmission = async (req: Request, res: Response, _next: NextFunction) => {
        try {
            const { token } = req.params;
            const secret = process.env.JWT_SECRET || 'dev-secret-key';
            const decoded = jwt.verify(token, secret) as { studentId: number; campaignId: number; value: boolean };

            const { studentId, campaignId, value: completed } = decoded;

            const submissionRepo = AppDataSource.getRepository(HabitSubmission);
            const streakRepo = AppDataSource.getRepository(Streak);
            const pointsRepo = AppDataSource.getRepository(PointsLedger);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check if already submitted
            const existing = await submissionRepo.findOne({
                where: { studentId, campaignId, submissionDate: today }
            });

            if (existing) {
                return res.send('<h1>Already submitted for today!</h1><p>Thank you for your update.</p>');
            }

            // Create submission
            const submission = submissionRepo.create({
                studentId,
                campaignId,
                submissionDate: today,
                completed,
                rating: completed ? 'good' : null
            });
            await submissionRepo.save(submission);

            if (completed) {
                // Update streak (logic adapted from HabitController)
                let streak = await streakRepo.findOne({ where: { studentId, campaignId } });
                if (!streak) {
                    streak = streakRepo.create({ studentId, campaignId, currentStreak: 0, longestStreak: 0 });
                }

                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                if (streak.lastSubmissionDate && new Date(streak.lastSubmissionDate).getTime() === yesterday.getTime()) {
                    streak.currentStreak += 1;
                } else {
                    streak.currentStreak = 1;
                }

                if (streak.currentStreak > streak.longestStreak) {
                    streak.longestStreak = streak.currentStreak;
                }

                streak.lastSubmissionDate = today;
                await streakRepo.save(streak);

                // Add points
                const multiplier = streak.currentStreak >= 30 ? 2.0 : streak.currentStreak >= 7 ? 1.5 : streak.currentStreak >= 3 ? 1.2 : 1.0;
                const totalPoints = Math.floor(10 * multiplier);

                const pointsEntry = pointsRepo.create({
                    studentId,
                    campaignId,
                    submissionId: submission.id,
                    submissionDate: today,
                    basePoints: 10,
                    streakMultiplier: multiplier,
                    bonusMultiplier: 1.0,
                    totalPoints
                });
                await pointsRepo.save(pointsEntry);
            }

            res.send(`<h1>Update Saved!</h1><p>You have marked today as ${completed ? 'COMPLETED' : 'NOT COMPLETED'}. Keep it up!</p>`);
        } catch (error) {
            res.status(400).send('<h1>Invalid or Expired Link</h1><p>Please use the link from your most recent email.</p>');
        }
    };

    private generateToken(user: User): string {
        const secret = process.env.JWT_SECRET || 'dev-secret-key';
        const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            secret,
            { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
        );
    }
}
