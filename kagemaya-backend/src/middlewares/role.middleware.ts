import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export const authorizeRoles = (...roles: Array<'CUSTOMER' | 'ORGANIZER'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna belum terotentikasi.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Fitur ini hanya untuk peran: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};