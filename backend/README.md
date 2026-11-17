# Escro Marketplace Backend

Express.js REST API for the Escro multi-vendor marketplace platform with integrated escrow payment system.

## 🚀 Features

- **Multi-vendor marketplace** - Support for customers, sellers, couriers, and agencies
- **Escrow payments** - Secure transactions with Stripe payment holding
- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Product Management** - Full CRUD operations for products and stores
- **Order Management** - Complete order lifecycle with status tracking
- **Delivery System** - Courier assignment and tracking
- **Review System** - Customer reviews and ratings
- **Database** - PostgreSQL via Supabase with optimized schema

## 📋 Prerequisites

- Node.js (v16 or higher)
- Supabase account
- Stripe account
- npm or yarn

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `database/schema.sql`
3. Get your project URL and API keys from Settings > API

### 3. Set Up Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Get your Secret Key from Developers > API keys
3. Set up webhooks endpoint: `https://your-domain.com/api/webhooks/stripe`
4. Get webhook signing secret

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_to_something_random
JWT_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 🚀 Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "customer",
  "phone": "+1234567890"
}
```

**Roles**: `customer`, `seller`, `courier`, `agency`

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "status": "success",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Product Endpoints

#### Get All Products
```http
GET /api/products?page=1&limit=20&search=laptop&min_price=100&max_price=1000
```

Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search term
- `category` - Filter by category
- `store_id` - Filter by store
- `min_price` - Minimum price
- `max_price` - Maximum price
- `sort` - Sort field (default: created_at, use `-` for descending)

#### Get Single Product
```http
GET /api/products/:id
```

#### Create Product (Seller only)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "store_id": "uuid",
  "title": "MacBook Pro 14-inch",
  "description": "M3 chip, 16GB RAM, 512GB SSD",
  "price": 1999.99,
  "compare_price": 2199.99,
  "quantity": 10,
  "sku": "MBP-M3-16-512",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

#### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 1899.99,
  "quantity": 8
}
```

#### Delete Product
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

### Order Endpoints

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2
    }
  ],
  "shipping_address": {
    "shipping_name": "John Doe",
    "shipping_phone": "+1234567890",
    "shipping_address": "123 Main St",
    "shipping_city": "New York",
    "shipping_state": "NY",
    "shipping_zip": "10001",
    "shipping_country": "USA"
  }
}

Response includes Stripe clientSecret for payment
```

#### Get My Orders
```http
GET /api/orders?page=1&status=pending
Authorization: Bearer <token>
```

#### Get Order Details
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Confirm Delivery (Releases Escrow)
```http
POST /api/orders/:id/confirm
Authorization: Bearer <token>
```

#### Cancel Order (Refunds Payment)
```http
POST /api/orders/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Changed my mind"
}
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 💳 Escrow Payment Flow

1. **Order Creation**: Customer creates order, payment is authorized but not captured
2. **Payment Hold**: Funds are held in escrow via Stripe Payment Intent
3. **Fulfillment**: Seller ships the product
4. **Delivery Confirmation**: Customer confirms receipt
5. **Escrow Release**: Funds are captured and transferred to seller

## 🗄️ Database Schema

Key tables:
- `users` - All platform users
- `stores` - Seller storefronts
- `products` - Product listings
- `orders` - Customer orders
- `order_items` - Order line items
- `escrow_transactions` - Payment escrow records
- `deliveries` - Delivery tracking
- `couriers` - Delivery personnel
- `reviews` - Product/seller reviews
- `agencies` - Logistics agencies

See `database/schema.sql` for complete schema.

## 📁 Project Structure

```
escro-backend/
├── config/
│   └── supabase.js          # Supabase client configuration
├── controllers/
│   ├── auth.controller.js   # Authentication logic
│   ├── product.controller.js # Product CRUD operations
│   ├── order.controller.js  # Order & escrow management
│   └── webhook.controller.js # Stripe webhooks
├── middleware/
│   └── auth.middleware.js   # JWT verification & authorization
├── routes/
│   ├── auth.routes.js       # Auth endpoints
│   ├── product.routes.js    # Product endpoints
│   ├── order.routes.js      # Order endpoints
│   └── ... (other routes)
├── database/
│   └── schema.sql           # PostgreSQL schema
├── .env.example             # Environment variables template
├── package.json             # Dependencies
└── server.js                # Express app entry point
```

## 🔄 Next Steps to Implement

### High Priority
1. **Store Management**
   - Create store controller
   - Store settings and customization
   - Store analytics dashboard

2. **Courier System**
   - Delivery assignment logic
   - Route optimization
   - Real-time tracking

3. **Review System**
   - Product reviews
   - Seller ratings
   - Review moderation

### Medium Priority
4. **Image Upload**
   - Supabase Storage integration
   - Image optimization
   - Multer configuration

5. **Email Notifications**
   - Order confirmations
   - Shipping updates
   - Payment notifications

6. **Search & Filters**
   - Elasticsearch integration
   - Advanced product search
   - Category filtering

### Nice to Have
7. **Analytics**
   - Sales dashboards
   - User behavior tracking
   - Revenue reports

8. **Admin Panel**
   - User management
   - Order management
   - Platform settings

## 🧪 Testing

```bash
npm test
```

## 🚢 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use production Stripe keys
3. Configure CORS for your frontend domain
4. Set up proper logging

### Recommended Platforms
- **Render** - Easy deployment with free tier
- **Railway** - Great for Node.js apps
- **Heroku** - Classic PaaS
- **Digital Ocean** - More control
- **AWS/Google Cloud** - Enterprise scale

### Deployment Checklist
- [ ] Set all environment variables
- [ ] Configure Stripe webhooks
- [ ] Set up Supabase production database
- [ ] Enable rate limiting
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

## 🔒 Security Considerations

- All passwords are hashed with bcrypt
- JWT tokens expire after 7 days (configurable)
- Rate limiting on all API routes
- Helmet.js for security headers
- Input validation on all endpoints
- Role-based access control
- Escrow prevents fraud

## 📞 Support

For questions or issues, please create an issue in the repository.

## 📄 License

MIT
