import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { connectDB } from './config/db.js';

export const app = express();

// Middlewares de CORS para suportar produção na Vercel e dev local
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
      ].filter(Boolean) as string[];

      // Permite chamadas locais, mobile/serverless sem origin, ou domínios da Vercel
      if (!origin || allowed.includes(origin) || allowed.includes('*') || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-pin'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para garantir conexão ativa com MongoDB em ambientes Serverless
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[Serverless DB Error]:', error);
    next(error);
  }
});

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

export default app;

