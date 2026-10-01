import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('[Database Error] MONGODB_URI não foi definida nas variáveis de ambiente.');
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('[Database Error] Falha ao conectar ao MongoDB:', error);
    throw error;
  }
}
