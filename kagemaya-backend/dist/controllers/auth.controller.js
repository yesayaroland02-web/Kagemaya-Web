"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
const register = async (req, res) => {
    try {
        const result = await (0, auth_service_1.registerUser)(req.body);
        return (0, response_1.successResponse)(res, 'Registrasi berhasil', result, 201);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal registrasi', 400, error);
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const result = await (0, auth_service_1.loginUser)(req.body);
        return (0, response_1.successResponse)(res, 'Login berhasil', result, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal login', 400, error);
    }
};
exports.login = login;
