import { Router } from 'express';
import memberRoutes from './memberRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import awardRoutes from './awardRoutes.js';
import tmdbRoutes from './tmdbRoutes.js';
import tierConfigRoutes from './tierConfigRoutes.js';
import periodRoutes from './periodRoutes.js';
import ceremonyRoutes from './ceremonyRoutes.js';
import voteRoutes from './voteRoutes.js';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/members', memberRoutes);
apiRouter.use('/sessions', sessionRoutes);
apiRouter.use('/awards', awardRoutes);
apiRouter.use('/tmdb', tmdbRoutes);
apiRouter.use('/tierconfig', tierConfigRoutes);
apiRouter.use('/periods', periodRoutes);
apiRouter.use('/ceremonies', ceremonyRoutes);
apiRouter.use('/votes', voteRoutes);
apiRouter.use('/admin', adminRoutes);

// Endpoint de status da API
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'Cine Chapéu API', timestamp: new Date().toISOString() });
});

export default apiRouter;
