"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCoupons = exports.getMyPoints = void 0;
const reward_service_1 = require("../services/reward.service");
const response_1 = require("../utils/response");
// =========================================================
// GET /api/me/points
// =========================================================
const getMyPoints = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await (0, reward_service_1.getMyPointsService)(userId);
        return (0, response_1.successResponse)(res, 'Data poin berhasil diambil.', data, 200);
    }
    catch (error) {
        console.error('Get my points error:', error);
        return (0, response_1.errorResponse)(res, error.message ||
            'Gagal mengambil data poin.', 500, error);
    }
};
exports.getMyPoints = getMyPoints;
// =========================================================
// GET /api/me/coupons
// =========================================================
const getMyCoupons = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = await (0, reward_service_1.getMyCouponsService)(userId);
        return (0, response_1.successResponse)(res, 'Data kupon berhasil diambil.', data, 200);
    }
    catch (error) {
        console.error('Get my coupons error:', error);
        return (0, response_1.errorResponse)(res, error.message ||
            'Gagal mengambil data kupon.', 500, error);
    }
};
exports.getMyCoupons = getMyCoupons;
