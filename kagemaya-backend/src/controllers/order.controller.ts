import { Request, Response } from 'express';
import { getOrderByIdService } from '../services/order.service';

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID Wajib diisi.',
      });
    }

    const data = await getOrderByIdService(id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Get Order Controller Error:', error.message);
    return res.status(404).json({
      success: false,
      message: error.message || 'Data tidak ditemukan.',
    });
  }
};