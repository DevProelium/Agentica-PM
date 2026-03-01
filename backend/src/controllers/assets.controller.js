import { uploadFile, getSignedUrl, deleteFile } from '../config/minio.js';
import path from 'path';

export async function upload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const ext    = path.extname(req.file.originalname);
    const key    = `uploads/${req.user.id}/${Date.now()}${ext}`;
    await uploadFile(key, req.file.buffer, req.file.mimetype);

    const url = await getSignedUrl(key, 3600);
    res.status(201).json({ key, url });
  } catch (err) { next(err); }
}

export async function signedUrl(req, res, next) {
  try {
    const { key, expiry } = req.query;
    if (!key) return res.status(400).json({ error: 'key required' });
    const url = await getSignedUrl(key, parseInt(expiry || '3600'));
    res.json({ url });
  } catch (err) { next(err); }
}

export async function deleteAsset(req, res, next) {
  try {
    const key = decodeURIComponent(req.params.key);
    // Restrict to user's own files
    if (!key.startsWith(`uploads/${req.user.id}/`)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await deleteFile(key);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}
