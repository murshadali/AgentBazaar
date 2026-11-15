import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from backend directory regardless of cwd
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'baka9isy',
  api_key: process.env.CLOUDINARY_API_KEY || '842679923996125',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Y9dt-iI6ZAcu7z6aLDZ1MlAIxIA',
  secure: true
});

export default cloudinary;
