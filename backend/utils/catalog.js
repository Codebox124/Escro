// backend/utils/catalog.js
// Shared product query + shaping for the buyer-facing APIs.

const { supabaseAdmin } = require('../config/supabase');

const isMissingColumn = (error) => error && (error.code === '42703' || error.code === 'PGRST204');

// stores.currency only exists after migration 001; detect once per request path.
let storeCurrencyColumn = true;
const storeFields = () =>
  `id, store_name, store_slug, logo_url, is_verified, rating${storeCurrencyColumn ? ', currency' : ''}`;

const PRODUCT_FIELDS = () => `
  id, title, slug, description, price, compare_price, quantity, rating, total_reviews,
  total_sales, created_at,
  product_images ( image_url, is_primary, sort_order ),
  product_categories ( categories ( id, name, slug ) ),
  stores!inner ( ${storeFields()}, is_active )
`;

function toProduct(row) {
  const images = (row.product_images || [])
    .slice()
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((i) => i.image_url);
  const category = row.product_categories?.[0]?.categories || null;
  const store = row.stores || {};
  return {
    id: row.id,
    name: row.title,
    slug: row.slug,
    description: row.description || '',
    price: Number(row.price),
    comparePrice: row.compare_price != null ? Number(row.compare_price) : null,
    stock: row.quantity ?? 0,
    inStock: (row.quantity ?? 0) > 0,
    rating: Number(row.rating || 0),
    reviews: row.total_reviews || 0,
    sales: row.total_sales || 0,
    image: images[0] || null,
    images,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    store: {
      id: store.id,
      name: store.store_name,
      slug: store.store_slug,
      logo: store.logo_url || null,
      verified: !!store.is_verified,
      currency: store.currency || 'ngn',
    },
    createdAt: row.created_at,
  };
}

/** Run a products query, retrying without stores.currency if that column is missing. */
async function queryProducts(build) {
  let { data, error, count } = await build(PRODUCT_FIELDS());
  if (error && isMissingColumn(error) && storeCurrencyColumn) {
    storeCurrencyColumn = false;
    ({ data, error, count } = await build(PRODUCT_FIELDS()));
  }
  if (error) throw error;
  return { rows: data || [], count };
}

module.exports = { isMissingColumn, PRODUCT_FIELDS, toProduct, queryProducts, supabaseAdmin };
