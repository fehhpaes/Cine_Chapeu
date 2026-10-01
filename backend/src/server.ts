import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🎬 Cine Chapéu Backend rodando com sucesso na porta ${PORT}!`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Falha ao inicializar o servidor:', error);
    process.exit(1);
  }
}

bootstrap();
