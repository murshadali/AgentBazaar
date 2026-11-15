import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Please upload an image file (PNG, JPG, JPEG, WEBP).'), false);
    }
  }
});

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private
router.post('/', protect, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    try {
      const uploadStream = (options) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
          stream.end(req.file.buffer);
        });
      };

      let result;
      try {
        result = await uploadStream({
          folder: 'agentbazaar/products',
          resource_type: 'image'
        });
      } catch (streamErr) {
        if (process.env.CLOUDINARY_UPLOAD_PRESET) {
          result = await uploadStream({
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            resource_type: 'image'
          });
        } else {
          throw streamErr;
        }
      }

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        url: result.secure_url,
        public_id: result.public_id
      });
    } catch (uploadError) {
      console.error('[Cloudinary Upload Error]:', uploadError);
      res.status(500).json({
        success: false,
        message: uploadError.message || 'Failed to upload image to Cloudinary.'
      });
    }
  });
});

export default router;
