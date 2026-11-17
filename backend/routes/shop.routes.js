// backend/routes/shop.routes.js
// Public marketplace data for buyers. Mounted at /api/shop. No login required.

const express = require('express');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fail = (res, error, fallback) => {
  console.error(fallback, error);
  res.status(500).json({ status: 'error', message: error?.message || fallback });
};

const { isMissingColumn, toProduct, queryProducts } = require('../utils/catalog');

/**
 * GET /api/shop/products
 *   ?search=&category=<slug>&store=<id>&sort=newest|price_asc|price_desc|popular|rating
 *   &minPrice=&maxPrice=&inStock=true&page=1&limit=24
 */
router.get('/products', async (req, res) => {
  try {
    const { search, category, store, sort = 'newest', minPrice, maxPrice, inStock } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 24));

    // Category filter → product ids in that category
    let categoryIds = null;
    if (category) {
      const { data: cat } = await supabaseAdmin.from('categories').select('id').eq('slug', category).maybeSingle();
      if (!cat) {
        return res.status(200).json({ status: 'success', data: { products: [], total: 0, page, pages: 0 } });
      }
      const { data: links, error } = await supabaseAdmin
        .from('product_categories')
        .select('product_id')
        .eq('category_id', cat.id);
      if (error) throw error;
      categoryIds = (links || []).map((l) => l.product_id);
      if (!categoryIds.length) {
        return res.status(200).json({ status: 'success', data: { products: [], total: 0, page, pages: 0 } });
      }
    }

    const { rows, count } = await queryProducts((fields) => {
      let q = supabaseAdmin
        .from('products')
        .select(fields, { count: 'exact' })
        .eq('is_active', true)
        .eq('stores.is_active', true);
      if (search) q = q.ilike('title', `%${String(search).trim()}%`);
      if (store && UUID_RE.test(store)) q = q.eq('store_id', store);
      if (categoryIds) q = q.in('id', categoryIds);
      if (minPrice) q = q.gte('price', Number(minPrice));
      if (maxPrice) q = q.lte('price', Number(maxPrice));
      if (inStock === 'true') q = q.gt('quantity', 0);
      const order = {
        newest: ['created_at', false],
        price_asc: ['price', true],
        price_desc: ['price', false],
        popular: ['total_sales', false],
        rating: ['rating', false],
      }[sort] || ['created_at', false];
      return q.order(order[0], { ascending: order[1] }).range((page - 1) * limit, page * limit - 1);
    });

    res.status(200).json({
      status: 'success',
      data: { products: rows.map(toProduct), total: count || 0, page, pages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    fail(res, error, 'Failed to load products');
  }
});

/** GET /api/shop/products/:id  (id or slug) — includes a few related products */
router.get('/products/:id', async (req, res) => {
  try {
    const key = req.params.id;
    const { rows } = await queryProducts((fields) => {
      const q = supabaseAdmin.from('products').select(fields).eq('is_active', true).limit(1);
      return UUID_RE.test(key) ? q.eq('id', key) : q.eq('slug', key);
    });
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Product not found' });
    const product = toProduct(rows[0]);

    const { rows: related } = await queryProducts((fields) =>
      supabaseAdmin
        .from('products')
        .select(fields)
        .eq('is_active', true)
        .eq('store_id', product.store.id)
        .neq('id', product.id)
        .order('total_sales', { ascending: false })
        .limit(8)
    );

    res.status(200).json({ status: 'success', data: { product, related: related.map(toProduct) } });
  } catch (error) {
    fail(res, error, 'Failed to load product');
  }
});

/** GET /api/shop/categories — categories that have at least one product, with counts */
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug, product_categories ( product_id )')
      .order('name');
    if (error) throw error;
    const categories = (data || [])
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: (c.product_categories || []).length }))
      .filter((c) => c.count > 0);
    res.status(200).json({ status: 'success', data: { categories } });
  } catch (error) {
    fail(res, error, 'Failed to load categories');
  }
});

function toStore(row, productCount = 0) {
  return {
    id: row.id,
    name: row.store_name,
    slug: row.store_slug,
    description: row.description || '',
    tagline: row.tagline || '',
    logo: row.logo_url || null,
    banner: row.banner_url || null,
    verified: !!row.is_verified,
    rating: Number(row.rating || 0),
    reviews: row.total_reviews || 0,
    currency: row.currency || 'ngn',
    productCount,
    createdAt: row.created_at,
  };
}

async function selectStores(build) {
  const base =
    'id, store_name, store_slug, description, logo_url, banner_url, is_verified, rating, total_reviews, created_at, products ( id )';
  let { data, error } = await build(`${base}, tagline, currency`);
  if (error && isMissingColumn(error)) ({ data, error } = await build(base));
  if (error) throw error;
  return data || [];
}

/** GET /api/shop/stores?search= */
router.get('/stores', async (req, res) => {
  try {
    const { search } = req.query;
    const rows = await selectStores((fields) => {
      let q = supabaseAdmin.from('stores').select(fields).eq('is_active', true).order('created_at', { ascending: false });
      if (search) q = q.ilike('store_name', `%${String(search).trim()}%`);
      return q;
    });
    const stores = rows.map((r) => toStore(r, (r.products || []).length));
    res.status(200).json({ status: 'success', data: { stores } });
  } catch (error) {
    fail(res, error, 'Failed to load stores');
  }
});

/** GET /api/shop/stores/:id  (id or slug) */
router.get('/stores/:id', async (req, res) => {
  try {
    const key = req.params.id;
    const rows = await selectStores((fields) => {
      const q = supabaseAdmin.from('stores').select(fields).eq('is_active', true).limit(1);
      return UUID_RE.test(key) ? q.eq('id', key) : q.eq('store_slug', key);
    });
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Store not found' });
    res.status(200).json({ status: 'success', data: { store: toStore(rows[0], (rows[0].products || []).length) } });
  } catch (error) {
    fail(res, error, 'Failed to load store');
  }
});

module.exports = router;
