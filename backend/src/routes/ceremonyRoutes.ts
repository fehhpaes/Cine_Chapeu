import { Router } from 'express';
import { ceremonyController } from '../controllers/ceremonyController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /api/ceremonies/active - Retorna cerimônia ativa com votação aberta
router.get('/active', (req, res) => ceremonyController.getActive(req, res));

// GET /api/ceremonies/:year - Retorna cerimônia de um ano específico
router.get('/:year', (req, res) => ceremonyController.getByYear(req, res));

// GET /api/ceremonies?year=YYYY
router.get('/', (req, res) => ceremonyController.getByYear(req, res));

// POST /api/ceremonies - Cria ou atualiza período da cerimônia (Protegido por PIN)
router.post('/', authMiddleware, (req, res) => ceremonyController.save(req, res));

export default router;

