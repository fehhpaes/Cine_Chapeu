import { Router, Request, Response } from 'express';

const router = Router();

router.post('/verify', (req: Request, res: Response): void => {
  const { pin } = req.body;
  const expectedPin = process.env.ADMIN_PIN;

  if (!expectedPin) {
    res.status(500).json({
      success: false,
      isValid: false,
      message: 'ADMIN_PIN não configurado no servidor.',
    });
    return;
  }

  if (pin && String(pin).trim() === String(expectedPin).trim()) {
    res.status(200).json({
      success: true,
      isValid: true,
      message: 'PIN de administrador validado com sucesso.',
    });
    return;
  }

  res.status(401).json({
    success: false,
    isValid: false,
    message: 'PIN incorreto. Acesso negado.',
  });
});

export default router;
