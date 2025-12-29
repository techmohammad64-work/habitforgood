import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorMiddleware = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${statusCode} - ${message}`);
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};

export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string = 'Bad Request') {
        return new ApiError(message, 400);
    }

    static unauthorized(message: string = 'Unauthorized') {
        return new ApiError(message, 401);
    }

    static forbidden(message: string = 'Forbidden') {
        return new ApiError(message, 403);
    }

    static notFound(message: string = 'Not Found') {
        return new ApiError(message, 404);
    }

    static conflict(message: string = 'Conflict') {
        return new ApiError(message, 409);
    }

    static internal(message: string = 'Internal Server Error') {
        return new ApiError(message, 500);
    }
}
