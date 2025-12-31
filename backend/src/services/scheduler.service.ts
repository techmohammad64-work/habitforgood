import cron from 'node-cron';
import { AppDataSource } from '../config/database';
import { Enrollment } from '../entities/enrollment.entity';
import { emailQueue } from './queue.service';

export class SchedulerService {
    
    init() {
        // eslint-disable-next-line no-console
        console.log('📅 Initializing scheduler...');

        // Schedule check every hour at minute 0
        cron.schedule('0 * * * *', async () => {
            // eslint-disable-next-line no-console
            console.log('🔔 Running hourly daily email check...');
            await this.scheduleDailyEmails();
        });
    }

    async scheduleDailyEmails() {
        const enrollmentRepo = AppDataSource.getRepository(Enrollment);
        const targetHour = 9; // 9 AM local time

        try {
            // Find active enrollments for students whose user's local time is 9 AM
            // and have notifications enabled
            const enrollments = await enrollmentRepo.createQueryBuilder('enrollment')
                .innerJoinAndSelect('enrollment.student', 'student')
                .innerJoinAndSelect('student.user', 'user')
                .where('user.email_notifications_enabled = :enabled', { enabled: true })
                .andWhere("EXTRACT(HOUR FROM (CURRENT_TIMESTAMP AT TIME ZONE user.timezone)) = :targetHour", { targetHour })
                .getMany();

            // eslint-disable-next-line no-console
            console.log(`[Scheduler] Found ${enrollments.length} users to notify`);

            for (const enrollment of enrollments) {
                // Add job to queue
                await emailQueue.add(
                    'daily-reminder',
                    {
                        userId: enrollment.student.user.id,
                        studentId: enrollment.student.id,
                        enrollmentId: enrollment.id,
                        campaignId: enrollment.campaignId,
                        email: enrollment.student.user.email
                    },
                    {
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 2000,
                        },
                        removeOnComplete: true,
                        removeOnFail: 24 * 3600 * 1000 // Keep failed jobs for 24h
                    }
                );
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('❌ Error in scheduler:', error);
        }
    }
}

export const schedulerService = new SchedulerService();
