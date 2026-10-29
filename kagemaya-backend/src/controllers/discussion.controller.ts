import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { errorResponse, successResponse } from '../utils/response';
import {
  createDiscussionService,
  getDiscussionsByEventService,
  togglePinDiscussionService,
} from '../services/discussion.service';

export const getDiscussions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, 'ID Event wajib disertakan', 400);
    }

    const discussions = await getDiscussionsByEventService(id);
    return successResponse(res, 'Daftar diskusi berhasil diambil', discussions, 200);
  } catch (error: any) {
    const status = error.message === 'Event tidak ditemukan' ? 404 : 500;
    return errorResponse(res, error.message || 'Gagal memuat diskusi', status);
  }
};

export const createDiscussion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { content, parent_id } = req.body;

    if (!userId) {
      return errorResponse(res, 'Autentikasi diperlukan. Silakan login terlebih dahulu.', 401);
    }
    if (!id) {
      return errorResponse(res, 'ID Event wajib disertakan', 400);
    }
    if (!content || !content.trim()) {
      return errorResponse(res, 'Konten diskusi atau balasan tidak boleh kosong', 400);
    }

    const newDiscussion = await createDiscussionService(id, userId, content, parent_id);
    return successResponse(res, 'Pertanyaan/balasan berhasil dikirim', newDiscussion, 201);
  } catch (error: any) {
    const status = error.message.includes('tidak ditemukan') ? 404 : 400;
    return errorResponse(res, error.message || 'Gagal mengirim diskusi', status);
  }
};

export const togglePinDiscussion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user?.id;
    const { id } = req.params;

    if (!requesterId) {
      return errorResponse(res, 'Autentikasi diperlukan', 401);
    }
    if (!id) {
      return errorResponse(res, 'ID Diskusi wajib disertakan', 400);
    }

    const updated = await togglePinDiscussionService(id, requesterId);
    return successResponse(
      res,
      updated.is_pinned ? 'Jawaban/diskusi berhasil disematkan' : 'Sematkan diskusi berhasil dilepas',
      updated,
      200
    );
  } catch (error: any) {
    const status = error.message.includes('Hanya penyelenggara')
      ? 403
      : error.message.includes('tidak ditemukan')
      ? 404
      : 400;
    return errorResponse(res, error.message || 'Gagal mengubah status pin diskusi', status);
  }
};
