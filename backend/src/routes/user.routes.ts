import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

// Protected routes
router.use(authMiddleware);

router.get('/me', userController.getCurrentUser);
router.put('/me', userController.updateProfile);
router.get('/me/profile', userController.getProfileDetails);
router.patch('/me/preferences', userController.updatePreferences);

export default router;
