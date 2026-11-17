const { supabaseAdmin } = require('../config/supabase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * @desc    Create new order with escrow
 * @route   POST /api/orders
 * @access  Private (Customer)
 */
exports.createOrder = async (req, res, next) => {
  try {
    const {
      items, // [{ product_id, quantity }]
      shipping_address
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Order must contain at least one item'
      });
    }

    // Get product details
    const productIds = items.map(item => item.product_id);
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, price, quantity, store_id, title')
      .in('id', productIds);

    if (products.length !== items.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more products not found'
      });
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for ${product.title}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });
    }

    // Calculate shipping and total (simplified - you can add complex logic)
    const shipping_fee = 5.00;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping_fee + tax;

    // Create Stripe Payment Intent (hold funds in escrow)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      capture_method: 'manual', // Don't capture immediately (escrow)
      metadata: {
        customer_id: req.user.id,
        order_type: 'marketplace'
      }
    });

    // Create order
    const order_number = generateOrderNumber();
    const store_id = products[0].store_id; // Assuming single store per order

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        order_number,
        customer_id: req.user.id,
        store_id,
        status: 'pending',
        subtotal,
        shipping_fee,
        tax,
        total,
        ...shipping_address
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) throw itemsError;

    // Create escrow transaction
    const { error: escrowError } = await supabaseAdmin
      .from('escrow_transactions')
      .insert([{
        order_id: order.id,
        amount: total,
        status: 'held',
        stripe_payment_intent_id: paymentIntent.id
      }]);

    if (escrowError) throw escrowError;

    // Update product quantities
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      await supabaseAdmin
        .from('products')
        .update({ quantity: product.quantity - item.quantity })
        .eq('id', item.product_id);
    }

    res.status(201).json({
      status: 'success',
      data: {
        order,
        clientSecret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user orders
 * @route   GET /api/orders
 * @access  Private
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(*, product:products(title, product_images(image_url))),
        store:stores(store_name, store_slug),
        escrow_transactions(status, amount)
      `, { count: 'exact' })
      .eq('customer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: {
        orders,
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
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(*, product:products(title, product_images(image_url))),
        store:stores(store_name, store_slug, seller_id),
        escrow_transactions(*),
        deliveries(*, courier:couriers(user:users(full_name, phone)))
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.customer_id !== req.user.id && 
        order.store.seller_id !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm order delivery and release escrow
 * @route   POST /api/orders/:id/confirm
 * @access  Private (Customer)
 */
exports.confirmDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get order with escrow
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, escrow_transactions(*)')
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.customer_id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    if (order.status === 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Order already confirmed'
      });
    }

    // Capture payment in Stripe (release escrow)
    const escrow = order.escrow_transactions[0];
    await stripe.paymentIntents.capture(escrow.stripe_payment_intent_id);

    // Update order status
    await supabaseAdmin
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', id);

    // Update escrow status
    await supabaseAdmin
      .from('escrow_transactions')
      .update({ 
        status: 'released',
        released_at: new Date().toISOString()
      })
      .eq('order_id', id);

    res.status(200).json({
      status: 'success',
      message: 'Order confirmed and payment released to seller'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel order and refund
 * @route   POST /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, escrow_transactions(*)')
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.customer_id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    if (['completed', 'cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel this order'
      });
    }

    // Cancel payment intent in Stripe
    const escrow = order.escrow_transactions[0];
    await stripe.paymentIntents.cancel(escrow.stripe_payment_intent_id);

    // Update order
    await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id);

    // Update escrow
    await supabaseAdmin
      .from('escrow_transactions')
      .update({ 
        status: 'refunded',
        refunded_at: new Date().toISOString()
      })
      .eq('order_id', id);

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled and refunded'
    });
  } catch (error) {
    next(error);
  }
};
