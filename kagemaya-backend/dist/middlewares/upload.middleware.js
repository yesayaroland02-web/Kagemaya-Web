"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleImage = void 0;
const multer_1 = __importDefault(require("multer"));
// Use memoryStorage so the file is kept in memory as Buffer for Cloudinary stream upload
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Format gambar harus JPG, PNG, atau WEBP.'));
    }
    cb(null, true);
};
exports.uploadSingleImage = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
