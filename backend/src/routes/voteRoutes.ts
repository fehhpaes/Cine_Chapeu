import { Router } from 'express';
import { voteController } from '../controllers/voteController.js';

const router = Router();

// POST /api/votes - Submete a cédula de votação do Oscar
router.post('/', (req, res) => voteController.submit(req, res));

// GET /api/votes/my-vote - Verifica se o membro já votou
router.get('/my-vote', (req, res) => voteController.getMyVote(req, res));

export default router;
