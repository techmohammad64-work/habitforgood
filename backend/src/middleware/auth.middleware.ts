import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './error.middleware';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}

export interface JwtPayload {
    id: number;
    email: string;
    role: string;
}

export const authMiddleware = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'dev-secret-key';

        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(ApiError.unauthorized('Invalid token'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(ApiError.unauthorized('Token expired'));
        } else {
            next(error);
        }
    }
};

export const roleMiddleware = (...allowedRoles: string[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(ApiError.unauthorized('Authentication required'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(ApiError.forbidden('Insufficient permissions'));
        }

        next();
    };
};
