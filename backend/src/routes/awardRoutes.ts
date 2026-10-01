import { Router } from 'express';
import { awardController } from '../controllers/awardController.js';

const router = Router();

// GET /api/awards/years - Lista anos disponíveis de Oscar
router.get('/years', (req, res) => awardController.getYears(req, res));

// GET /api/awards/:year - Busca categorias, indicados e vencedores com populate aninhado profundo
router.get('/:year', (req, res) => awardController.getByYear(req, res));

// POST /api/awards - Cadastra nova categoria/premiação
router.post('/', (req, res) => awardController.create(req, res));

export default router;
