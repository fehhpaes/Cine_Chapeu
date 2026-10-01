import { Router } from 'express';
import memberRoutes from './memberRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import awardRoutes from './awardRoutes.js';

const apiRouter = Router();

apiRouter.use('/members', memberRoutes);
apiRouter.use('/sessions', sessionRoutes);
apiRouter.use('/awards', awardRoutes);

// Endpoint de status da API
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'Cine Chapéu API', timestamp: new Date().toISOString() });
});

export default apiRouter;
