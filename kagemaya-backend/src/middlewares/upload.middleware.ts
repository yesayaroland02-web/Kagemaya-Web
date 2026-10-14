import multer from 'multer';

// Use memoryStorage so the file is kept in memory as Buffer for Cloudinary stream upload
const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (
  _req,
  file,
  cb
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error('Format gambar harus JPG, PNG, atau WEBP.')
    );
  }

  cb(null, true);
};

export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});