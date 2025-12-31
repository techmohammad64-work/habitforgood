import nodemailer from 'nodemailer';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { SponsorPledge } from '../entities/sponsor-pledge.entity';
import jwt from 'jsonwebtoken';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Use SMTP settings from environment
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
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

        try {
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

    async sendEnrollmentConfirmation(
        user: User,
        student: Student,
        campaignTitle: string
    ): Promise<boolean> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00a6e5;">Welcome to ${campaignTitle}! 🎉</h2>
                <p>Hi ${student.displayName},</p>
                <p>You've successfully joined the <strong>${campaignTitle}</strong> campaign!</p>
                <p>Here's what happens next:</p>
                <ul>
                    <li>📅 Complete your daily habits</li>
                    <li>⭐ Earn points for each habit completed</li>
                    <li>🔥 Build streaks for bonus points</li>
                    <li>💝 Your sponsors will donate based on your points</li>
                </ul>
                <p>You'll receive daily reminders to help you stay on track. Keep up the great work!</p>
                <p style="margin-top: 30px;">
                    <a href="${process.env.APP_URL || 'http://localhost:4200'}/campaigns" 
                       style="background: #00a6e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        View My Campaigns
                    </a>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    Questions? Reply to this email or visit our help center.
                </p>
            </div>
        `;

        try {
            await this.transporter.sendMail({
                from: '"Habits for Good" <noreply@habitsforgood.com>',
                to: user.email,
                subject: `Welcome to ${campaignTitle}! 🎉`,
                html,
            });
            return true;
        } catch (mailError: any) {
            console.error(`❌ Enrollment email failed for ${user.email}:`, (mailError as Error).message);
            return false;
        }
    }

    async sendUnenrollmentConfirmation(
        user: User,
        student: Student,
        campaignTitle: string
    ): Promise<boolean> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00a6e5;">You've left ${campaignTitle}</h2>
                <p>Hi ${student.displayName},</p>
                <p>You've successfully unenrolled from the <strong>${campaignTitle}</strong> campaign.</p>
                <p>We're sad to see you go, but we understand that priorities change. Your progress and points from this campaign have been saved.</p>
                <p>Want to make a difference again? You can always join other campaigns or come back to this one later!</p>
                <p style="margin-top: 30px;">
                    <a href="${process.env.APP_URL || 'http://localhost:4200'}/campaigns" 
                       style="background: #00a6e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Browse Campaigns
                    </a>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    We hope to see you back soon! 💚
                </p>
            </div>
        `;

        try {
            await this.transporter.sendMail({
                from: '"Habits for Good" <noreply@habitsforgood.com>',
                to: user.email,
                subject: `You've left ${campaignTitle}`,
                html,
            });
            return true;
        } catch (mailError: any) {
            console.error(`❌ Unenrollment email failed for ${user.email}:`, (mailError as Error).message);
            return false;
        }
    }
}
