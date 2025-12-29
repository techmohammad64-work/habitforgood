import nodemailer from 'nodemailer';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { SponsorPledge } from '../entities/sponsor-pledge.entity';
import jwt from 'jsonwebtoken';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Use Ethereal for development or real SMTP for production
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
                user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
                pass: process.env.SMTP_PASS || 'ethereal.pass',
            },
        });
    }

    async sendDailyReminder(
        user: User,
        student: Student,
        campaignId: number,
        pledge?: SponsorPledge
    ): Promise<boolean> {
        const secret = process.env.JWT_SECRET || 'dev-secret-key';
        const tokenPayload = { userId: user.id, studentId: student.id, campaignId };

        const yesToken = jwt.sign({ ...tokenPayload, value: true }, secret, { expiresIn: '24h' });
        const noToken = jwt.sign({ ...tokenPayload, value: false }, secret, { expiresIn: '24h' });

        const baseUrl = process.env.API_URL_PUBLIC || 'http://localhost:3000/api';
        const yesLink = `${baseUrl}/auth/email-submission/${yesToken}`;
        const noLink = `${baseUrl}/auth/email-submission/${noToken}`;

        const note = this.generateEncouragingNote(student);
        const adContent = pledge ? `
            <div style="border: 1px solid #ddd; padding: 10px; margin: 20px 0;">
                <h4>A message from our sponsor: ${pledge.sponsor.name}</h4>
                <p>${pledge.message || ''}</p>
                ${pledge.adImageUrl ? `<img src="${pledge.adImageUrl}" style="max-width: 100%;" />` : ''}
            </div>
        ` : '';

        const html = `
            <h2>Hi ${student.displayName}!</h2>
            <p>${note}</p>
            ${adContent}
            <div style="margin: 30px 0;">
                <p>Did you complete your habits for today?</p>
                <a href="${yesLink}" style="background: #4caf50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Yes, I did it!</a>
                <a href="${noLink}" style="background: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Not today</a>
            </div>
            <p>You don't need to log in to submit your update.</p>
        `;

        // Check if SMTP is likely the default (not configured)
        const isMock = !process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.ethereal.email';

        try {
            if (isMock && process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.log(`[EMAIL MOCK] To: ${user.email} | Subject: Your daily habit check-in!`);
                return true;
            }

            await this.transporter.sendMail({
                from: '"Habits for Good" <noreply@habitsforgood.com>',
                to: user.email,
                subject: 'Your daily habit check-in!',
                html,
            });
            return true;
        } catch (mailError: any) {
            // eslint-disable-next-line no-console
            console.error(`❌ Email failed for ${user.email}:`, (mailError as Error).message);
            throw new Error(`Email failed for ${user.email}: ${(mailError as Error).message}`);
        }
    }

    private generateEncouragingNote(_student: Student): string {
        // Simple logic for now, could be more complex
        return 'Keep going! You\'re doing great making positive changes every day.';
    }
}
