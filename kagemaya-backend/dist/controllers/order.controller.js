"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderById = void 0;
const order_service_1 = require("../services/order.service");
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID Wajib diisi.',
            });
        }
        const data = await (0, order_service_1.getOrderByIdService)(id);
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error('Get Order Controller Error:', error.message);
        return res.status(404).json({
            success: false,
            message: error.message || 'Data tidak ditemukan.',
        });
    }
};
exports.getOrderById = getOrderById;
