import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Admin } from '../entities/admin.entity';
import { Sponsor } from '../entities/sponsor.entity';
import { ApiError } from '../middleware/error.middleware';

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
            const decoded = jwt.verify(token, secret) as any; // Cast to any first to avoid type issues with JwtPayload if needed, or import JwtPayload
            // Actually, let's just use number for local cast to be safe if JwtPayload is not imported
            const userId = (decoded as { id: number }).id;

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
