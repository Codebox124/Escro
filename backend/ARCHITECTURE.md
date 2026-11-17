# Escro Marketplace - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Web App    │  │  Mobile App  │  │  Admin Dashboard     │  │
│  │ (React/Next) │  │ (React Native)│  │     (React)         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          └──────────────────┼─────────────────────┘
                             │ HTTPS/REST API
          ┌──────────────────▼─────────────────────────────────┐
          │              API GATEWAY / NGINX                    │
          │          (Rate Limiting, CORS, Compression)         │
          └──────────────────┬─────────────────────────────────┘
                             │
          ┌──────────────────▼─────────────────────────────────┐
          │              EXPRESS.JS SERVER                      │
          │  ┌─────────────────────────────────────────────┐  │
          │  │          Middleware Layer                    │  │
          │  │  • Authentication (JWT)                      │  │
          │  │  • Authorization (Role-based)                │  │
          │  │  • Validation                                │  │
          │  │  • Error Handling                            │  │
          │  └─────────────────────────────────────────────┘  │
          │  ┌─────────────────────────────────────────────┐  │
          │  │          Route Handlers                      │  │
          │  │  /auth  /products  /orders  /couriers        │  │
          │  │  /stores  /escrow  /reviews  /agencies       │  │
          │  └─────────────────────────────────────────────┘  │
          │  ┌─────────────────────────────────────────────┐  │
          │  │          Business Logic (Controllers)        │  │
          │  │  • User Management                           │  │
          │  │  • Product Catalog                           │  │
          │  │  • Order Processing                          │  │
          │  │  • Escrow Management                         │  │
          │  │  • Delivery Coordination                     │  │
          │  └─────────────────────────────────────────────┘  │
          └───────┬──────────────────┬───────────────────────┘
                  │                  │
       ┌──────────▼──────┐  ┌────────▼──────────┐
       │   SUPABASE      │  │      STRIPE       │
       │   (PostgreSQL)  │  │  (Payment Gateway)│
       │                 │  │                   │
       │  • Users        │  │  • Payment Intents│
       │  • Products     │  │  • Escrow Hold    │
       │  • Orders       │  │  • Capture/Refund │
       │  • Escrow Txns  │  │  • Webhooks       │
       │  • Reviews      │  │                   │
       │  • Storage      │  │                   │
       └─────────────────┘  └───────────────────┘
```

## 🔄 Key Workflows

### 1. User Registration & Authentication Flow

```
User → Register → Hash Password → Store in DB → Generate JWT → Return Token
User → Login → Verify Password → Generate JWT → Return Token
User → Protected Route → Verify JWT → Extract User → Allow Access
```

### 2. Product Listing Flow

```
Seller → Create Store → Upload Products → Add Images → Publish
Buyer → Browse Products → Filter/Search → View Details → Add to Cart
```

### 3. Order & Escrow Payment Flow

```
1. Customer creates order
   └─> Calculate totals (items + shipping + tax)
   
2. Create Stripe Payment Intent
   └─> Amount: Total
   └─> Capture Method: Manual (escrow)
   
3. Customer completes payment
   └─> Funds HELD (not captured)
   └─> Order status: Pending
   
4. Seller fulfills order
   └─> Mark as shipped
   └─> Assign courier (optional)
   
5. Customer receives & confirms
   └─> Click "Confirm Delivery"
   
6. Release Escrow
   └─> Stripe captures payment
   └─> Transfer to seller
   └─> Order status: Completed
   
Alternative: Cancel/Refund
   └─> Cancel Payment Intent
   └─> Refund customer
   └─> Order status: Cancelled
```

### 4. Delivery Assignment Flow

```
Order Created → Notify Couriers → Courier Accepts → Pickup → In Transit → Delivered
```

## 📊 Database Schema Overview

### Core Tables

**users**
- User accounts (customers, sellers, couriers, agencies)
- Authentication credentials
- Profile information

**stores**
- Seller storefronts
- Branding and settings
- Performance metrics

**products**
- Product listings
- Pricing and inventory
- Product images

**orders**
- Customer orders
- Order items (line items)
- Shipping information
- Status tracking

**escrow_transactions**
- Payment holds
- Stripe Payment Intent IDs
- Release/refund tracking

**deliveries**
- Courier assignments
- Delivery tracking
- Status updates

**reviews**
- Product reviews
- Seller ratings
- Verified purchase badges

## 🔐 Security Architecture

### Authentication
- **JWT Tokens**: Stateless authentication
- **bcrypt**: Password hashing (10 rounds)
- **Token Expiry**: 7 days (configurable)

### Authorization
- **Role-Based Access Control (RBAC)**
  - Customer: Browse, order, review
  - Seller: Manage products, fulfill orders
  - Courier: Accept deliveries, update status
  - Agency: Manage fleet, bulk operations
  - Admin: Full access

### API Security
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for specific frontend origins
- **Helmet.js**: Security headers
- **Input Validation**: Express-validator
- **SQL Injection Prevention**: Supabase parameterized queries

### Payment Security
- **PCI Compliance**: Through Stripe (no card data stored)
- **Escrow System**: Funds held until delivery confirmed
- **Webhook Verification**: Stripe signature validation

## 🚀 Deployment Architecture

### Recommended Setup

```
┌─────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                          │
│              (CDN, DDoS Protection, SSL)                 │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                   LOAD BALANCER                          │
│              (Nginx or Cloud Provider)                   │
└──────┬─────────────────────┬──────────────────────────┘
       │                     │
   ┌───▼────┐           ┌────▼───┐
   │ Server 1│           │Server 2│  (Horizontal Scaling)
   │ (Node) │           │ (Node) │
   └───┬────┘           └────┬───┘
       │                     │
       └──────────┬──────────┘
                  │
     ┌────────────▼────────────┐
     │   SUPABASE (Managed)    │
     │   PostgreSQL Database   │
     │   Automated Backups     │
     └─────────────────────────┘
```

### Environment Separation

**Development**
- Local Node.js server
- Supabase development project
- Stripe test mode

**Staging**
- Deployed on Render/Railway
- Supabase staging project
- Stripe test mode
- Mirrors production

**Production**
- Production deployment
- Supabase production project
- Stripe live mode
- Monitoring & logging

## 📈 Scalability Considerations

### Current Architecture (MVP)
- Single server instance
- Direct Supabase connection
- Suitable for: 0-10,000 users

### Scale to 100K Users
- **Add**: Redis for caching
- **Add**: CDN for static assets
- **Add**: Read replicas for database
- **Add**: Queue system (Bull/BeeQueue)

### Scale to 1M+ Users
- **Add**: Microservices architecture
- **Add**: Event-driven with Kafka/RabbitMQ
- **Add**: Multiple database shards
- **Add**: Elasticsearch for search
- **Add**: Dedicated analytics pipeline

## 🔧 Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js | JavaScript runtime |
| Framework | Express.js | Web framework |
| Database | PostgreSQL (Supabase) | Primary data store |
| Authentication | JWT | Stateless auth |
| Payments | Stripe | Payment processing |
| File Storage | Supabase Storage | Product images |
| Security | Helmet, bcrypt | Security layers |

## 📊 Monitoring & Logging

### Recommended Tools
- **Application Monitoring**: Sentry, LogRocket
- **Server Monitoring**: PM2, New Relic
- **Database Monitoring**: Supabase Dashboard
- **Uptime**: UptimeRobot, Pingdom
- **Logs**: Winston + CloudWatch/Papertrail

## 🎯 Performance Optimization

### Database
- Indexed columns for fast queries
- Connection pooling via Supabase
- Query optimization with EXPLAIN

### API
- Compression middleware (gzip)
- Response caching where appropriate
- Pagination on list endpoints

### Security
- Rate limiting to prevent abuse
- JWT verification caching
- Password hashing optimization

## 🔄 Future Enhancements

1. **Real-time Features**
   - WebSocket for live updates
   - Real-time order tracking
   - Live chat support

2. **Advanced Analytics**
   - Sales dashboards
   - User behavior tracking
   - Revenue forecasting

3. **AI/ML Features**
   - Product recommendations
   - Fraud detection
   - Dynamic pricing

4. **Internationalization**
   - Multi-currency support
   - Multi-language support
   - Region-specific features
