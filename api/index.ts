import { app } from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor Vercel.',
      error: error.message,
    });
  }
}
