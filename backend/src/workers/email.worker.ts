import { Worker, Job } from 'bullmq';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { SponsorPledge } from '../entities/sponsor-pledge.entity';
import { NotificationLog } from '../entities/notification-log.entity';
import { EmailService } from '../services/email.service';

const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export class EmailWorker {
    private worker: Worker;
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
        this.worker = new Worker('daily-reminder', this.processJob.bind(this), {
            connection: redisConnection,
            concurrency: 5, // Process 5 emails at a time
        });

        this.worker.on('completed', (job) => {
            console.log(`[Worker] Job ${job.id} completed! Email sent to ${job.data.email}`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
        });
    }

    async processJob(job: Job) {
        const { userId, studentId, campaignId } = job.data;
        const logRepo = AppDataSource.getRepository(NotificationLog);

        try {
            // Fetch entities
            const userRepo = AppDataSource.getRepository(User);
            const studentRepo = AppDataSource.getRepository(Student);
            const pledgeRepo = AppDataSource.getRepository(SponsorPledge);

            const user = await userRepo.findOneBy({ id: userId });
            const student = await studentRepo.findOneBy({ id: studentId });
            
            if (!user || !student) {
                throw new Error(`Data missing for job ${job.id}`);
            }

            // Fetch active pledge for ad content
            const pledge = await pledgeRepo.findOne({
                where: { campaignId: campaignId, status: 'active' },
                relations: ['sponsor'],
            });

            // Send Email
            await this.emailService.sendDailyReminder(user, student, campaignId, pledge || undefined);

            // Log Success
            const log = logRepo.create({
                userId,
                type: 'daily-reminder',
                status: 'sent',
                sentAt: new Date(),
            });
            await logRepo.save(log);

        } catch (error: any) {
            // Log Failure
            const log = logRepo.create({
                userId,
                type: 'daily-reminder',
                status: 'failed',
                error: error.message,
            });
            await logRepo.save(log);

            throw error; // Re-throw to trigger BullMQ retry
        }
    }
}

export const emailWorker = new EmailWorker();
