"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizerDashboardStats = void 0;
const response_1 = require("../utils/response");
const dashboard_service_1 = require("../services/dashboard.service");
const getOrganizerDashboardStats = async (req, res) => {
    try {
        const organizerId = req.user.id;
        const days = req.query.days ? parseInt(req.query.days, 10) : 30;
        const stats = await (0, dashboard_service_1.getOrganizerDashboardStatsService)(organizerId, days);
        return (0, response_1.successResponse)(res, 'Statistik dashboard organizer berhasil dimuat.', stats, 200);
    }
    catch (error) {
        console.error('Error getOrganizerDashboardStats:', error);
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengambil statistik dashboard organizer.', 500, error);
    }
};
exports.getOrganizerDashboardStats = getOrganizerDashboardStats;
