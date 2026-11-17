
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products
 * @access  Public (but personalized if authenticated)
 */
router.get('/products/featured', optionalAuth, async (req, res) => {
  try {
    const { limit = 8, userId } = req.query;
    const authenticatedUserId = req.user?.id;

    console.log('Fetching featured products, userId:', authenticatedUserId || userId);

    // TODO: Replace with actual database query
    // If user is authenticated, can personalize recommendations
    // const Product = require('../models/Product');
    // const products = await Product.find({ featured: true, inStock: true })
    //   .limit(parseInt(limit))
    //   .populate('seller', 'name rating')
    //   .sort('-views');

    // Sample featured products
    const products = [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        price: 199.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        seller: {
          id: 'seller1',
          name: 'TechStore',
          rating: 4.8
        },
        category: 'Electronics',
        inStock: true,
        views: 1250,
        sales: 89
      },
      {
        id: '2',
        name: 'Smart Watch Series 5',
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        seller: {
          id: 'seller2',
          name: 'GadgetHub',
          rating: 4.9
        },
        category: 'Electronics',
        inStock: true,
        views: 2100,
        sales: 156
      },
      {
        id: '3',
        name: 'Designer Leather Bag',
        price: 149.99,
        image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500',
        seller: {
          id: 'seller3',
          name: 'FashionStore',
          rating: 4.7
        },
        category: 'Fashion',
        inStock: true,
        views: 890,
        sales: 67
      },
      {
        id: '4',
        name: 'Professional Camera Kit',
        price: 899.99,
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500',
        seller: {
          id: 'seller4',
          name: 'PhotoPro',
          rating: 4.9
        },
        category: 'Electronics',
        inStock: true,
        views: 1560,
        sales: 34
      },
      {
        id: '5',
        name: 'Ergonomic Office Chair',
        price: 249.99,
        image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500',
        seller: {
          id: 'seller5',
          name: 'HomeOffice',
          rating: 4.6
        },
        category: 'Furniture',
        inStock: true,
        views: 780,
        sales: 45
      },
      {
        id: '6',
        name: 'Bluetooth Speaker',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
        seller: {
          id: 'seller1',
          name: 'TechStore',
          rating: 4.8
        },
        category: 'Electronics',
        inStock: true,
        views: 1020,
        sales: 92
      },
      {
        id: '7',
        name: 'Running Shoes',
        price: 129.99,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        seller: {
          id: 'seller6',
          name: 'SportZone',
          rating: 4.7
        },
        category: 'Sports',
        inStock: true,
        views: 1450,
        sales: 112
      },
      {
        id: '8',
        name: 'Coffee Maker Pro',
        price: 189.99,
        image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500',
        seller: {
          id: 'seller7',
          name: 'KitchenEssentials',
          rating: 4.8
        },
        category: 'Home & Kitchen',
        inStock: true,
        views: 920,
        sales: 78
      }
    ];

    // Limit results
    const limitedProducts = products.slice(0, parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: {
        products: limitedProducts,
        total: limitedProducts.length
      }
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch featured products'
    });
  }
});

/**
 * @route   GET /api/services/featured
 * @desc    Get featured services
 * @access  Public
 */
router.get('/services/featured', optionalAuth, async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    // TODO: Replace with actual database query
    const services = [
      {
        id: '1',
        name: 'Professional Web Development',
        price: 499.99,
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500',
        provider: {
          name: 'WebDev Pro',
          rating: 4.9
        },
        category: 'Web Development',
        deliveryTime: '7 days'
      },
      {
        id: '2',
        name: 'Logo Design & Branding',
        price: 149.99,
        image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500',
        provider: {
          name: 'Creative Studio',
          rating: 4.8
        },
        category: 'Design',
        deliveryTime: '3 days'
      },
      {
        id: '3',
        name: 'Digital Marketing Strategy',
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
        provider: {
          name: 'Marketing Experts',
          rating: 4.7
        },
        category: 'Marketing',
        deliveryTime: '5 days'
      },
      {
        id: '4',
        name: 'Mobile App Development',
        price: 799.99,
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500',
        provider: {
          name: 'App Masters',
          rating: 4.9
        },
        category: 'Development',
        deliveryTime: '14 days'
      }
    ];

    const limitedServices = services.slice(0, parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: {
        services: limitedServices,
        total: limitedServices.length
      }
    });
  } catch (error) {
    console.error('Error fetching featured services:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch featured services'
    });
  }
});

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    // TODO: Replace with actual database query
    const categories = [
      { id: '1', name: 'Electronics', icon: '💻', count: 1250 },
      { id: '2', name: 'Fashion', icon: '👗', count: 890 },
      { id: '3', name: 'Home & Kitchen', icon: '🏠', count: 560 },
      { id: '4', name: 'Sports', icon: '⚽', count: 420 },
      { id: '5', name: 'Books', icon: '📚', count: 780 },
      { id: '6', name: 'Toys', icon: '🧸', count: 340 },
      { id: '7', name: 'Beauty', icon: '💄', count: 620 },
      { id: '8', name: 'Automotive', icon: '🚗', count: 290 }
    ];

    res.status(200).json({
      status: 'success',
      data: {
        categories,
        total: categories.length
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories'
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product details
 * @access  Public
 */
router.get('/products/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Replace with actual database query
    // const product = await Product.findById(id).populate('seller');

    const product = {
      id: id,
      name: 'Premium Wireless Headphones',
      price: 199.99,
      description: 'High-quality wireless headphones with noise cancellation',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
      ],
      seller: {
        id: 'seller1',
        name: 'TechStore',
        rating: 4.8,
        totalSales: 1250
      },
      category: 'Electronics',
      inStock: true,
      quantity: 45,
      specifications: {
        brand: 'Premium Audio',
        color: 'Black',
        warranty: '1 year'
      }
    };

    res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product details'
    });
  }
});

module.exports = router;