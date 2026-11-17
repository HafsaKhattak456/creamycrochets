import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
export const uploadDirectory = new URL('./uploads/', import.meta.url);
export const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, fieldSize: 16000, parts: 2 } }).single('photo');
export async function savePhoto(file) {
  if (!file) throw Object.assign(new Error('Choose a product photo.'), { status: 400 });
  let bytes;
  try {
    const image = sharp(file.buffer, { limitInputPixels: 25000000, animated: false });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format)) throw new Error();
    bytes = await image.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch { throw Object.assign(new Error('Use a valid JPG, PNG or WebP photo up to 25 megapixels.'), { status: 400 }); }
  const filename = `${randomUUID()}.webp`;
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(new URL(filename, uploadDirectory), bytes, { flag: 'wx' });
  return { path: `/uploads/${filename}`, async cleanup() { await unlink(new URL(filename, uploadDirectory)).catch(() => {}); } };
}
