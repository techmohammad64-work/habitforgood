import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';
import { authMiddleware, roleMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
const campaignController = new CampaignController();

// Public routes (with optional auth to check enrollment status)
router.get('/', campaignController.getAllCampaigns);
router.get('/featured', campaignController.getFeaturedCampaigns);
router.get('/:id', optionalAuthMiddleware, campaignController.getCampaignById);
router.get('/:id/leaderboard', campaignController.getLeaderboard);

// Protected routes
router.use(authMiddleware);

// Student enrollment
router.post('/:id/enroll', roleMiddleware('student'), campaignController.enrollInCampaign);
router.delete('/:id/enroll', roleMiddleware('student'), campaignController.unenrollFromCampaign);
router.get('/:id/ad', roleMiddleware('student'), campaignController.getActiveAd);

// Admin campaign management
router.post('/', roleMiddleware('admin'), campaignController.createCampaign);
router.put('/:id', roleMiddleware('admin'), campaignController.updateCampaign);
router.post('/:id/pause', roleMiddleware('admin'), campaignController.pauseCampaign);
router.post('/:id/resume', roleMiddleware('admin'), campaignController.resumeCampaign);
router.post('/:id/trigger-emails', roleMiddleware('admin'), campaignController.triggerManualEmails);
router.delete('/:id', roleMiddleware('admin'), campaignController.deleteCampaign);

// Habit management for campaigns
router.post('/:id/habits', roleMiddleware('admin'), campaignController.addHabit);
router.put('/:id/habits/:habitId', roleMiddleware('admin'), campaignController.updateHabit);
router.delete('/:id/habits/:habitId', roleMiddleware('admin'), campaignController.deleteHabit);

export default router;
