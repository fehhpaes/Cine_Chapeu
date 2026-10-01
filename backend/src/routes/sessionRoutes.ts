import { Router } from 'express';
import { sessionController } from '../controllers/sessionController.js';

const router = Router();

// GET /api/sessions/tmdb-search?q=nome - Busca filmes na API do TMDB
router.get('/tmdb-search', (req, res) => sessionController.searchTMDB(req, res));

// GET /api/sessions/filter-options - Busca lista de categorias e anos para filtros
router.get('/filter-options', (req, res) => sessionController.getFilterOptions(req, res));

// GET /api/sessions - Lista sessões com filtros dinâmicos
router.get('/', (req, res) => sessionController.getAll(req, res));

// GET /api/sessions/:id - Busca detalhes de uma sessão
router.get('/:id', (req, res) => sessionController.getById(req, res));

// POST /api/sessions - Cria sessão com cache automático do TMDB
router.post('/', (req, res) => sessionController.create(req, res));

export default router;
