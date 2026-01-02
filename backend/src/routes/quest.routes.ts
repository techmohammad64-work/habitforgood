import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
// Temporarily disabled for debugging
// import {
//   getDailyQuests,
//   getPenaltyQuests,
//   completePenaltyQuest,
//   getRewards,
//   getAchievements,
//   openRandomBox,
//   checkAchievements,
//   getAchievementProgress,
//   getRewardStats,
// } from '../controllers/quest.controller';

const router = Router();

// Daily Quest Routes - Temporarily disabled
// router.get('/daily-quests', authenticateToken, getDailyQuests);

// Penalty Quest Routes
// router.get('/penalty-quests', authenticateToken, getPenaltyQuests);
// router.post('/penalty-quests/:penaltyId/complete', authenticateToken, completePenaltyQuest);

// Reward Routes
// router.get('/rewards', authenticateToken, getRewards);
// router.post('/rewards/open-box', authenticateToken, openRandomBox);
// router.get('/rewards/stats', authenticateToken, getRewardStats);

// Achievement Routes
// router.get('/achievements', authenticateToken, getAchievements);
// router.post('/achievements/check', authenticateToken, checkAchievements);
// router.get('/achievements/progress', authenticateToken, getAchievementProgress);

export default router;
