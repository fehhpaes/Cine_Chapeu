import { Router } from 'express';
import { sessionController } from '../controllers/sessionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /api/sessions/next - Busca a próxima sessão agendada (exhibitionDate >= hoje)
router.get('/next', (req, res) => sessionController.getNext(req, res));

// GET /api/sessions/tmdb-search?q=nome - Busca filmes na API do TMDB
router.get('/tmdb-search', (req, res) => sessionController.searchTMDB(req, res));

// GET /api/sessions/filter-options - Busca lista de categorias e anos para filtros
router.get('/filter-options', (req, res) => sessionController.getFilterOptions(req, res));

// GET /api/sessions - Lista sessões com filtros dinâmicos
router.get('/', (req, res) => sessionController.getAll(req, res));

// GET /api/sessions/:id - Busca detalhes de uma sessão
router.get('/:id', (req, res) => sessionController.getById(req, res));

// POST /api/sessions - Cria sessão com cache automático do TMDB (Protegido por PIN)
router.post('/', authMiddleware, (req, res) => sessionController.create(req, res));

// PATCH /api/sessions/:id/tier - Atualiza o tier de classificação de uma sessão (Protegido por PIN)
router.patch('/:id/tier', authMiddleware, (req, res) => sessionController.updateTier(req, res));

export default router;

