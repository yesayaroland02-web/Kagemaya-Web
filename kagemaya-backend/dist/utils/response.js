"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
// Helper untuk Response Berhasil
const successResponse = (res, message, data = null, statusCode = 200, pagination = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...(pagination ? { pagination } : {}),
    });
};
exports.successResponse = successResponse;
// Helper untuk Response Gagal
const errorResponse = (res, message, statusCode = 400, error = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(error !== null && error !== undefined ? { error } : {}),
    });
};
exports.errorResponse = errorResponse;
