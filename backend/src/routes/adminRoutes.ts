import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /api/admin/dashboard?year=YYYY - Dashboard do Apresentador do Oscar (Protegido por PIN)
router.get('/dashboard', authMiddleware, (req, res) => dashboardController.getDashboard(req, res));

export default router;

