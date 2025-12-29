import cron from 'node-cron';
import { AppDataSource } from '../config/database';
import { Enrollment } from '../entities/enrollment.entity';
import { EmailService } from './email.service';
import { SponsorPledge } from '../entities/sponsor-pledge.entity';

export class SchedulerService {
    private emailService = new EmailService();

    init() {
        // eslint-disable-next-line no-console
        console.log('📅 Initializing scheduler...');

        // Schedule 9 PM daily: '0 21 * * *'
        // For testing, users might want to trigger it faster or use a different time
        cron.schedule('0 21 * * *', async () => {
            // eslint-disable-next-line no-console
            console.log('🔔 Running daily habit notification job at 9 PM');
            await this.sendDailyNotifications();
        });
    }

    async sendDailyNotifications() {
        await this.sendCampaignNotifications();
    }

    async sendCampaignNotifications(campaignId?: number): Promise<{ total: number; success: number; failed: number }> {
        let total = 0;
        let success = 0;
        let failed = 0;

        try {
            const enrollmentRepo = AppDataSource.getRepository(Enrollment);
            const pledgeRepo = AppDataSource.getRepository(SponsorPledge);

            const query: { relations: string[], where?: { campaignId: number } } = {
                relations: ['student', 'student.user'],
            };

            if (campaignId) {
                query.where = { campaignId };
            }

            const enrollments = await enrollmentRepo.find(query);
            total = enrollments.length;

            for (const enrollment of enrollments) {
                try {
                    // Find an active pledge for this campaign
                    const pledge = await pledgeRepo.findOne({
                        where: { campaignId: enrollment.campaignId, status: 'active' },
                        relations: ['sponsor'],
                    });

                    await this.emailService.sendDailyReminder(
                        enrollment.student.user,
                        enrollment.student,
                        enrollment.campaignId,
                        pledge || undefined
                    );
                    success++;
                } catch (error: unknown) {
                    // eslint-disable-next-line no-console
                    console.error(`❌ Failed to send notification to ${enrollment.student.user.email}:`, (error as Error).message);
                    failed++;
                }
            }
            // eslint-disable-next-line no-console
            console.log(`✅ Processed ${total} notifications ${campaignId ? `for campaign ${campaignId}` : ''}. Success: ${success}, Failed: ${failed}`);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('❌ Error in notification job:', error);
        }

        return { total, success, failed };
    }
}
