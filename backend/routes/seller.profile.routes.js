// backend/routes/seller.profile.routes.js
// Seller profile + store details. Mounted at /api/seller/profile.

const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth.middleware');
const { imageUpload, handleUpload, uploadPublicImage } = require('../utils/storage');

const router = express.Router();
const BUCKET = 'profile-images';

router.use(protect, authorize('seller', 'admin'));

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const USER_FIELDS = 'id, email, full_name, phone, role, avatar_url, is_verified, created_at';
const STORE_FIELDS =
  'id, store_name, store_slug, description, logo_url, banner_url, is_verified, is_active, total_sales, rating, total_reviews, created_at';

// Extra settings columns added by database/migrations/001_store_settings.sql.
// Until that migration is run they don't exist, so we detect and skip them.
const EXTRA_COLUMNS = {
  tagline: 'tagline',
  businessEmail: 'business_email',
  businessPhone: 'business_phone',
  address: 'address',
  timezone: 'timezone',
  language: 'language',
  currency: 'currency',
};
let extrasAvailable = null; // null = not checked yet

const isMissingColumn = (error) => error && (error.code === '42703' || error.code === 'PGRST204');

async function getStore(userId) {
  const run = (fields) =>
    supabaseAdmin
      .from('stores')
      .select(fields)
      .eq('seller_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

  {
    const { data, error } = await run(`${STORE_FIELDS}, ${Object.values(EXTRA_COLUMNS).join(', ')}`);
    if (!error) {
      extrasAvailable = true;
      return data?.[0] || null;
    }
    if (!isMissingColumn(error)) throw error;
    extrasAvailable = false;
  }
  const { data, error } = await run(STORE_FIELDS);
  if (error) throw error;
  return data?.[0] || null;
}

async function buildProfile(userId) {
  const [{ data: user, error: userError }, store] = await Promise.all([
    supabaseAdmin.from('users').select(USER_FIELDS).eq('id', userId).single(),
    getStore(userId),
  ]);
  if (userError) throw userError;

  let productCount = 0;
  if (store) {
    const { count } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', store.id);
    productCount = count || 0;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone || '',
      role: user.role,
      avatarUrl: user.avatar_url,
      isVerified: user.is_verified,
      memberSince: user.created_at,
    },
    store: store
      ? {
          id: store.id,
          name: store.store_name,
          slug: store.store_slug,
          description: store.description || '',
          logoUrl: store.logo_url,
          bannerUrl: store.banner_url,
          isVerified: store.is_verified,
          isActive: store.is_active,
          totalSales: Number(store.total_sales || 0),
          rating: Number(store.rating || 0),
          totalReviews: store.total_reviews || 0,
          createdAt: store.created_at,
          settings: Object.fromEntries(
            Object.entries(EXTRA_COLUMNS).map(([key, col]) => [key, store[col] ?? null])
          ),
        }
      : null,
    stats: { products: productCount },
    // false until the store settings migration has been run in Supabase
    extendedSettings: extrasAvailable !== false,
  };
}

/** GET /api/seller/profile */
router.get('/', async (req, res) => {
  try {
    res.status(200).json({ status: 'success', data: await buildProfile(req.user.id) });
  } catch (error) {
    console.error('Failed to load profile', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to load profile' });
  }
});

/**
 * PUT /api/seller/profile
 * multipart/form-data — all fields optional:
 *   fullName, phone, storeName, storeDescription, avatar (file), logo (file), banner (file),
 *   tagline, businessEmail, businessPhone, address, timezone, language, currency
 */
router.put(
  '/',
  handleUpload(
    imageUpload.fields([
      { name: 'avatar', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ])
  ),
  async (req, res) => {
    try {
      const { fullName, phone, storeName, storeDescription } = req.body;
      const files = req.files || {};
      await getStore(req.user.id); // (re)detect optional columns

      if (fullName !== undefined && !String(fullName).trim()) {
        return res.status(400).json({ status: 'error', message: 'Full name cannot be empty' });
      }
      if (storeName !== undefined && !String(storeName).trim()) {
        return res.status(400).json({ status: 'error', message: 'Store name cannot be empty' });
      }

      // ---- user ----
      const userUpdates = {};
      if (fullName !== undefined) userUpdates.full_name = String(fullName).trim();
      if (phone !== undefined) userUpdates.phone = String(phone).trim() || null;
      if (files.avatar?.[0]) {
        userUpdates.avatar_url = await uploadPublicImage(BUCKET, `avatars/${req.user.id}`, files.avatar[0]);
      }
      if (Object.keys(userUpdates).length) {
        userUpdates.updated_at = new Date().toISOString();
        const { error } = await supabaseAdmin.from('users').update(userUpdates).eq('id', req.user.id);
        if (error) throw error;
      }

      // ---- store (created on first save if missing) ----
      const storeUpdates = {};
      if (storeName !== undefined) storeUpdates.store_name = String(storeName).trim();
      if (storeDescription !== undefined) storeUpdates.description = String(storeDescription).trim() || null;
      if (files.logo?.[0]) {
        storeUpdates.logo_url = await uploadPublicImage(BUCKET, `stores/${req.user.id}/logo`, files.logo[0]);
      }
      if (extrasAvailable !== false) {
        for (const [key, col] of Object.entries(EXTRA_COLUMNS)) {
          if (req.body[key] !== undefined) storeUpdates[col] = String(req.body[key]).trim() || null;
        }
      }
      if (files.banner?.[0]) {
        storeUpdates.banner_url = await uploadPublicImage(BUCKET, `stores/${req.user.id}/banner`, files.banner[0]);
      }

      if (Object.keys(storeUpdates).length) {
        const store = await getStore(req.user.id);
        if (store) {
          storeUpdates.updated_at = new Date().toISOString();
          const { error } = await supabaseAdmin.from('stores').update(storeUpdates).eq('id', store.id);
          if (error) throw error;
        } else {
          const name =
            storeUpdates.store_name || `${userUpdates.full_name || req.user.full_name || 'My'}'s Store`;
          const { error } = await supabaseAdmin.from('stores').insert([
            {
              ...storeUpdates,
              seller_id: req.user.id,
              store_name: name,
              store_slug: `${slugify(name)}-${Date.now()}`,
            },
          ]);
          if (error) throw error;
        }
      }

      res.status(200).json({ status: 'success', data: await buildProfile(req.user.id) });
    } catch (error) {
      console.error('Failed to update profile', error);
      res.status(500).json({ status: 'error', message: error.message || 'Failed to update profile' });
    }
  }
);

module.exports = router;
