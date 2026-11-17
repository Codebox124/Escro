// backend/utils/storage.js
// Small helpers around Supabase Storage + multer for image uploads.

const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');

// Vercel Functions accept request bodies up to 4.5 MB, so uploads are capped
// lower there; a standalone server allows 10 MB.
const MAX_IMAGE_BYTES = (process.env.VERCEL ? 4 : 10) * 1024 * 1024;
const MAX_IMAGE_LABEL = `${MAX_IMAGE_BYTES / (1024 * 1024)}MB`;

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

/** Wrap a multer middleware so upload errors become 400 JSON responses. */
const handleUpload = (middleware) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? `Image must be smaller than ${MAX_IMAGE_LABEL}` : err.message;
    res.status(400).json({ status: 'error', message });
  });
};

const readyBuckets = new Set();

/** Create a public bucket the first time it's needed. */
async function ensurePublicBucket(bucket) {
  if (readyBuckets.has(bucket)) return;
  const { data } = await supabaseAdmin.storage.getBucket(bucket);
  if (!data) {
    const { error } = await supabaseAdmin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: MAX_IMAGE_BYTES,
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  readyBuckets.add(bucket);
}

/** Upload a multer file to `${folder}/<timestamp>.<ext>` and return its public URL. */
async function uploadPublicImage(bucket, folder, file) {
  await ensurePublicBucket(bucket);
  const ext =
    (file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${folder}/${Date.now()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw error;
  return supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Remove every file directly inside `folder` (best effort). */
async function removeFolder(bucket, folder) {
  const { data: files } = await supabaseAdmin.storage.from(bucket).list(folder);
  if (files && files.length) {
    await supabaseAdmin.storage.from(bucket).remove(files.map((f) => `${folder}/${f.name}`));
  }
}

module.exports = { MAX_IMAGE_BYTES, imageUpload, handleUpload, uploadPublicImage, removeFolder };
