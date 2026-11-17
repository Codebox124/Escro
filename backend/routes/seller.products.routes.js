// backend/routes/seller.products.routes.js
// Seller product management backed by Supabase (DB + Storage for images).
// Mounted at /api/seller/products.

const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth.middleware');
const { imageUpload, handleUpload, uploadPublicImage, removeFolder } = require('../utils/storage');

const router = express.Router();

const BUCKET = 'product-images';
const acceptImage = handleUpload(imageUpload.single('image'));

router.use(protect, authorize('seller', 'admin'));

// ---------- helpers ----------

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Find the seller's store, creating one on first use. */
async function getOrCreateStore(user) {
  const { data: existing, error } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  if (existing && existing.length) return existing[0].id;

  const name = `${user.full_name || user.email.split('@')[0]}'s Store`;
  const { data: created, error: createError } = await supabaseAdmin
    .from('stores')
    .insert([{ seller_id: user.id, store_name: name, store_slug: `${slugify(name)}-${Date.now()}` }])
    .select('id')
    .single();
  if (createError) throw createError;
  return created.id;
}

/** Find or create a category by name and return its id. */
async function getCategoryId(name) {
  const clean = String(name || '').trim();
  if (!clean) return null;
  const slug = slugify(clean);
  const { data: found } = await supabaseAdmin.from('categories').select('id').eq('slug', slug).limit(1);
  if (found && found.length) return found[0].id;
  const { data: created, error } = await supabaseAdmin
    .from('categories')
    .insert([{ name: clean, slug }])
    .select('id')
    .single();
  if (error) throw error;
  return created.id;
}

async function setProductCategory(productId, categoryName) {
  if (categoryName === undefined) return;
  await supabaseAdmin.from('product_categories').delete().eq('product_id', productId);
  const categoryId = await getCategoryId(categoryName);
  if (categoryId) {
    const { error } = await supabaseAdmin
      .from('product_categories')
      .insert([{ product_id: productId, category_id: categoryId }]);
    if (error) throw error;
  }
}

/** Upload the image to Supabase Storage and make it the product's primary image. */
async function saveProductImage(productId, file) {
  if (!file) return;
  const url = await uploadPublicImage(BUCKET, productId, file);
  await supabaseAdmin.from('product_images').update({ is_primary: false }).eq('product_id', productId);
  const { error } = await supabaseAdmin
    .from('product_images')
    .insert([{ product_id: productId, image_url: url, is_primary: true, sort_order: 0 }]);
  if (error) throw error;
}

const PRODUCT_SELECT = `
  id, store_id, title, description, price, compare_price, quantity, sku,
  is_active, rating, total_sales, created_at, updated_at,
  product_images ( image_url, is_primary, sort_order ),
  product_categories ( categories ( name ) ),
  stores!inner ( seller_id )
`;

/** Shape a DB row the way the seller dashboard expects. */
function toClient(row) {
  const images = (row.product_images || []).slice().sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
  );
  return {
    id: row.id,
    name: row.title,
    description: row.description || '',
    price: Number(row.price),
    comparePrice: row.compare_price != null ? Number(row.compare_price) : null,
    stock: row.quantity ?? 0,
    sku: row.sku,
    category: row.product_categories?.[0]?.categories?.name || 'Uncategorized',
    image: images[0]?.image_url || null,
    images: images.map((i) => i.image_url),
    isActive: row.is_active,
    rating: Number(row.rating || 0),
    sales: row.total_sales || 0,
    createdAt: row.created_at,
  };
}

async function fetchOwnedProduct(productId, userId) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', productId)
    .eq('stores.seller_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const fail = (res, error, fallback) => {
  console.error(fallback, error);
  res.status(500).json({ status: 'error', message: error?.message || fallback });
};

// ---------- routes ----------

/** GET /api/seller/products?search=&category= */
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = supabaseAdmin
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('stores.seller_id', req.user.id)
      .order('created_at', { ascending: false });
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    let products = (data || []).map(toClient);
    if (category) products = products.filter((p) => p.category === category);

    res.status(200).json({ status: 'success', data: { products, total: products.length } });
  } catch (error) {
    fail(res, error, 'Failed to fetch products');
  }
});

/** GET /api/seller/products/:id */
router.get('/:id', async (req, res) => {
  try {
    const row = await fetchOwnedProduct(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ status: 'error', message: 'Product not found' });
    res.status(200).json({ status: 'success', data: toClient(row) });
  } catch (error) {
    fail(res, error, 'Failed to fetch product');
  }
});

/** POST /api/seller/products  (multipart: name, category, price, stock, description, image) */
router.post('/', acceptImage, async (req, res) => {
  try {
    const { name, category, price, stock, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ status: 'error', message: 'Product name is required' });
    }
    if (price === undefined || Number.isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ status: 'error', message: 'A valid price is required' });
    }

    const storeId = await getOrCreateStore(req.user);
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert([
        {
          store_id: storeId,
          title: String(name).trim(),
          slug: `${slugify(name)}-${Date.now()}`,
          description: description || null,
          price: Number(price),
          quantity: Number.parseInt(stock, 10) || 0,
        },
      ])
      .select('id')
      .single();
    if (error) throw error;

    await setProductCategory(product.id, category);
    await saveProductImage(product.id, req.file);

    const row = await fetchOwnedProduct(product.id, req.user.id);
    res.status(201).json({ status: 'success', data: toClient(row) });
  } catch (error) {
    fail(res, error, 'Failed to create product');
  }
});

/** PUT /api/seller/products/:id  (JSON or multipart; any subset of fields) */
router.put('/:id', acceptImage, async (req, res) => {
  try {
    const existing = await fetchOwnedProduct(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ status: 'error', message: 'Product not found' });

    const { name, category, price, stock, description } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.title = String(name).trim();
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = Number(price);
    if (stock !== undefined) updates.quantity = Number.parseInt(stock, 10) || 0;

    const { error } = await supabaseAdmin.from('products').update(updates).eq('id', req.params.id);
    if (error) throw error;

    await setProductCategory(req.params.id, category);
    await saveProductImage(req.params.id, req.file);

    const row = await fetchOwnedProduct(req.params.id, req.user.id);
    res.status(200).json({ status: 'success', data: toClient(row) });
  } catch (error) {
    fail(res, error, 'Failed to update product');
  }
});

/** PATCH /api/seller/products/:id/stock */
router.patch('/:id/stock', async (req, res) => {
  try {
    const existing = await fetchOwnedProduct(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ status: 'error', message: 'Product not found' });
    const quantity = Number.parseInt(req.body.stock, 10);
    if (Number.isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ status: 'error', message: 'Stock must be a non-negative number' });
    }
    const { error } = await supabaseAdmin.from('products').update({ quantity }).eq('id', req.params.id);
    if (error) throw error;
    const row = await fetchOwnedProduct(req.params.id, req.user.id);
    res.status(200).json({ status: 'success', data: toClient(row) });
  } catch (error) {
    fail(res, error, 'Failed to update stock');
  }
});

/** DELETE /api/seller/products/:id */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await fetchOwnedProduct(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ status: 'error', message: 'Product not found' });

    // Remove stored image files for this product (best effort).
    await removeFolder(BUCKET, req.params.id);

    const { error } = await supabaseAdmin.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(200).json({ status: 'success', message: 'Product deleted' });
  } catch (error) {
    fail(res, error, 'Failed to delete product');
  }
});

module.exports = router;
