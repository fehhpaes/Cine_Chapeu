import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// O app.listen() roda em ambiente de desenvolvimento local standalone.
// Na Vercel Serverless, a Vercel encapsula a exportação padrão do Express diretamente.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🎬 Cine Chapéu Backend rodando na porta ${PORT}`);
        console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      });
    })
    .catch((error) => {
      console.error('Falha ao inicializar banco de dados:', error);
    });
}

export default app;
