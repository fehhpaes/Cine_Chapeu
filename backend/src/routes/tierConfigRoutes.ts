import { Router } from 'express';
import { tierConfigController } from '../controllers/tierConfigController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /api/tierconfig - Retorna a configuração e ordem dos tiers
router.get('/', (req, res) => tierConfigController.get(req, res));

// PUT /api/tierconfig - Atualiza o layout e cores dos tiers (Protegido por PIN)
router.put('/', authMiddleware, (req, res) => tierConfigController.update(req, res));

export default router;

