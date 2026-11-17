const { supabaseAdmin } = require('../config/supabase');

/**
 * @desc    Get all products with filters
 * @route   GET /api/products
 * @access  Public
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      store_id, 
      min_price, 
      max_price,
      search,
      sort = 'created_at'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        store:stores(id, store_name, store_slug, rating),
        product_images(image_url, is_primary, sort_order)
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (store_id) query = query.eq('store_id', store_id);
    if (min_price) query = query.gte('price', min_price);
    if (max_price) query = query.lte('price', max_price);
    if (search) query = query.ilike('title', `%${search}%`);

    // Sorting
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const ascending = !sort.startsWith('-');
    query = query.order(sortField, { ascending });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID or slug
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ID is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        store:stores(id, store_name, store_slug, rating, logo_url),
        product_images(image_url, is_primary, sort_order),
        reviews(id, rating, comment, reviewer_id, created_at)
      `);

    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: product, error } = await query.single();

    if (error || !product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private (Seller only)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { 
      store_id,
      title, 
      description, 
      price, 
      compare_price,
      quantity,
      sku,
      images = []
    } = req.body;

    // Verify user owns the store
    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('seller_id')
      .eq('id', store_id)
      .single();

    if (!store || store.seller_id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to add products to this store'
      });
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    // Create product
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert([{
        store_id,
        title,
        slug,
        description,
        price,
        compare_price,
        quantity,
        sku
      }])
      .select()
      .single();

    if (error) throw error;

    // Add images if provided
    if (images.length > 0) {
      const imageData = images.map((url, index) => ({
        product_id: product.id,
        image_url: url,
        is_primary: index === 0,
        sort_order: index
      }));

      await supabaseAdmin
        .from('product_images')
        .insert(imageData);
    }

    res.status(201).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private (Seller only)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check product exists and user owns it
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('store_id, stores(seller_id)')
      .eq('id', id)
      .single();

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    if (product.stores.seller_id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this product'
      });
    }

    // Update product
    const { data: updatedProduct, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: { product: updatedProduct }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private (Seller only)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check product exists and user owns it
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('store_id, stores(seller_id)')
      .eq('id', id)
      .single();

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    if (product.stores.seller_id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this product'
      });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
