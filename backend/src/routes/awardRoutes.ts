import { Router } from 'express';
import { awardController } from '../controllers/awardController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /api/awards/years - Lista anos disponíveis de Oscar
router.get('/years', (req, res) => awardController.getYears(req, res));

// GET /api/awards?year=YYYY - Busca prêmios do ano via query param
router.get('/', (req, res) => awardController.getByYear(req, res));

// GET /api/awards/:year - Busca prêmios do ano via param de rota
router.get('/:year', (req, res) => awardController.getByYear(req, res));

// POST /api/awards - Cadastra nova categoria/premiação (Protegido por PIN)
router.post('/', authMiddleware, (req, res) => awardController.create(req, res));

export default router;

