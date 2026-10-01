import { Router } from 'express';
import { memberController } from '../controllers/memberController.js';

const router = Router();

// GET /api/members - Lista todos os membros
router.get('/', (req, res) => memberController.getAll(req, res));

// GET /api/members/active - Lista membros ativos
router.get('/active', (req, res) => memberController.getActive(req, res));

// GET /api/members/draw - Realiza o sorteio da roleta entre membros ativos
router.get('/draw', (req, res) => memberController.drawRandom(req, res));

// POST /api/members - Cadastra novo membro
router.post('/', (req, res) => memberController.create(req, res));

// PATCH /api/members/:id/toggle - Ativa/desativa membro
router.patch('/:id/toggle', (req, res) => memberController.toggle(req, res));

export default router;
