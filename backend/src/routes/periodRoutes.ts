import { Router } from 'express';
import { periodController } from '../controllers/periodController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /api/periods?year=YYYY - Lista períodos salvos para o ano
router.get('/', (req, res) => periodController.getByYear(req, res));

// POST /api/periods - Salva novo período customizado (Protegido por PIN)
router.post('/', authMiddleware, (req, res) => periodController.create(req, res));

// DELETE /api/periods/:id - Remove período por ID (Protegido por PIN)
router.delete('/:id', authMiddleware, (req, res) => periodController.delete(req, res));

export default router;

