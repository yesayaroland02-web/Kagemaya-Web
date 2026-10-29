"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizerFollowersById = exports.getMyFollowers = exports.checkFollowStatus = exports.getOrganizerProfile = exports.unfollowOrganizer = exports.followOrganizer = void 0;
const response_1 = require("../utils/response");
const follow_service_1 = require("../services/follow.service");
const followOrganizer = async (req, res) => {
    try {
        const followerId = req.user?.id;
        const { organizerId } = req.params;
        if (!followerId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan', 401);
        }
        if (!organizerId) {
            return (0, response_1.errorResponse)(res, 'ID Organizer wajib disertakan', 400);
        }
        const result = await (0, follow_service_1.followOrganizerService)(followerId, organizerId);
        return (0, response_1.successResponse)(res, result.alreadyFollowing
            ? 'Anda sudah mengikuti organizer ini'
            : 'Berhasil mengikuti organizer', result, result.alreadyFollowing ? 200 : 201);
    }
    catch (error) {
        const status = error.message === 'Organizer tidak ditemukan.'
            ? 404
            : error.message.includes('sendiri')
                ? 400
                : 500;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengikuti organizer', status);
    }
};
exports.followOrganizer = followOrganizer;
const unfollowOrganizer = async (req, res) => {
    try {
        const followerId = req.user?.id;
        const { organizerId } = req.params;
        if (!followerId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan', 401);
        }
        if (!organizerId) {
            return (0, response_1.errorResponse)(res, 'ID Organizer wajib disertakan', 400);
        }
        const result = await (0, follow_service_1.unfollowOrganizerService)(followerId, organizerId);
        return (0, response_1.successResponse)(res, 'Berhasil berhenti mengikuti organizer', result, 200);
    }
    catch (error) {
        const status = error.message === 'Anda belum mengikuti organizer ini.' ? 404 : 400;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal berhenti mengikuti organizer', status);
    }
};
exports.unfollowOrganizer = unfollowOrganizer;
const getOrganizerProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers['authorization'];
        let currentUserId;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const jwt = require('jsonwebtoken');
                const config = require('../config').default;
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, config.jwtSecret);
                currentUserId = decoded?.id;
            }
            catch {
                // ignore invalid token for public profile
            }
        }
        const profile = await (0, follow_service_1.getOrganizerPublicProfileService)(id, currentUserId);
        return (0, response_1.successResponse)(res, 'Profil organizer berhasil diambil', profile, 200);
    }
    catch (error) {
        const status = error.message === 'Organizer tidak ditemukan' ? 404 : 500;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengambil profil organizer', status);
    }
};
exports.getOrganizerProfile = getOrganizerProfile;
const checkFollowStatus = async (req, res) => {
    try {
        const followerId = req.user?.id;
        const { organizerId } = req.params;
        if (!followerId) {
            return (0, response_1.successResponse)(res, 'Status follow', { is_following: false, followers_count: 0 }, 200);
        }
        const result = await (0, follow_service_1.checkFollowStatusService)(followerId, organizerId);
        return (0, response_1.successResponse)(res, 'Status follow', result, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memeriksa status follow', 500);
    }
};
exports.checkFollowStatus = checkFollowStatus;
const getMyFollowers = async (req, res) => {
    try {
        const organizerId = req.user?.id;
        if (!organizerId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan', 401);
        }
        const data = await (0, follow_service_1.getOrganizerFollowersService)(organizerId);
        return (0, response_1.successResponse)(res, 'Daftar pengikut berhasil diambil', data, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengambil daftar pengikut', 500);
    }
};
exports.getMyFollowers = getMyFollowers;
const getOrganizerFollowersById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return (0, response_1.errorResponse)(res, 'ID Organizer wajib disertakan', 400);
        }
        const data = await (0, follow_service_1.getOrganizerFollowersService)(id);
        return (0, response_1.successResponse)(res, 'Daftar pengikut berhasil diambil', data, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengambil daftar pengikut', 500);
    }
};
exports.getOrganizerFollowersById = getOrganizerFollowersById;
