"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePinDiscussion = exports.createDiscussion = exports.getDiscussions = void 0;
const response_1 = require("../utils/response");
const discussion_service_1 = require("../services/discussion.service");
const getDiscussions = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return (0, response_1.errorResponse)(res, 'ID Event wajib disertakan', 400);
        }
        const discussions = await (0, discussion_service_1.getDiscussionsByEventService)(id);
        return (0, response_1.successResponse)(res, 'Daftar diskusi berhasil diambil', discussions, 200);
    }
    catch (error) {
        const status = error.message === 'Event tidak ditemukan' ? 404 : 500;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memuat diskusi', status);
    }
};
exports.getDiscussions = getDiscussions;
const createDiscussion = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { content, parent_id } = req.body;
        if (!userId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan. Silakan login terlebih dahulu.', 401);
        }
        if (!id) {
            return (0, response_1.errorResponse)(res, 'ID Event wajib disertakan', 400);
        }
        if (!content || !content.trim()) {
            return (0, response_1.errorResponse)(res, 'Konten diskusi atau balasan tidak boleh kosong', 400);
        }
        const newDiscussion = await (0, discussion_service_1.createDiscussionService)(id, userId, content, parent_id);
        return (0, response_1.successResponse)(res, 'Pertanyaan/balasan berhasil dikirim', newDiscussion, 201);
    }
    catch (error) {
        const status = error.message.includes('tidak ditemukan') ? 404 : 400;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengirim diskusi', status);
    }
};
exports.createDiscussion = createDiscussion;
const togglePinDiscussion = async (req, res) => {
    try {
        const requesterId = req.user?.id;
        const { id } = req.params;
        if (!requesterId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan', 401);
        }
        if (!id) {
            return (0, response_1.errorResponse)(res, 'ID Diskusi wajib disertakan', 400);
        }
        const updated = await (0, discussion_service_1.togglePinDiscussionService)(id, requesterId);
        return (0, response_1.successResponse)(res, updated.is_pinned ? 'Jawaban/diskusi berhasil disematkan' : 'Sematkan diskusi berhasil dilepas', updated, 200);
    }
    catch (error) {
        const status = error.message.includes('Hanya penyelenggara')
            ? 403
            : error.message.includes('tidak ditemukan')
                ? 404
                : 400;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengubah status pin diskusi', status);
    }
};
exports.togglePinDiscussion = togglePinDiscussion;
