"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
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
exports.authorizeRoles = authorizeRoles;
