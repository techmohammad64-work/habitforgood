import { Queue } from 'bullmq';

// We'll use the REDIS_HOST/PORT from env
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export const emailQueue = new Queue('daily-reminder', {
    connection: redisConnection,
});
