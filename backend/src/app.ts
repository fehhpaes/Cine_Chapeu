import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';

export const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/api', apiRouter);

// Rota raiz de boas-vindas
app.get('/', (_req, res) => {
  res.json({
    name: 'Cine Chapéu API',
    version: '1.0.0',
    description: 'API para registro e sorteio de sessões de cinema entre amigos',
    endpoints: {
      health: '/api/health',
      members: '/api/members',
      draw: '/api/members/draw',
      sessions: '/api/sessions',
      tmdbSearch: '/api/sessions/tmdb-search?q={query}',
      awards: '/api/awards/{year}',
    },
  });
});
