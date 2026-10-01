import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const providedPin = req.headers['x-admin-pin'] || req.header('x-admin-pin');
  const expectedPin = process.env.ADMIN_PIN;

  if (!expectedPin) {
    console.error('[AUTH] ADMIN_PIN não configurado nas variáveis de ambiente do backend.');
    res.status(500).json({
      success: false,
      message: 'Configuração de segurança do servidor ausente.',
    });
    return;
  }

  if (providedPin && String(providedPin).trim() === String(expectedPin).trim()) {
    next();
    return;
  }

  res.status(401).json({
    success: false,
    message: 'Acesso restrito. PIN de administrador inválido ou não fornecido.',
  });
};
