# 🚀 Quick Start Guide - Escro Backend

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)
```bash
npm install
```

### 2. Set Up Supabase (5 minutes)

**Create Project:**
1. Go to https://supabase.com
2. Click "New Project"
3. Name it "escro-marketplace"
4. Choose region closest to you
5. Create strong database password
6. Wait for project to initialize (~2 mins)

**Run Database Schema:**
1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy entire contents of `database/schema.sql`
4. Paste and click "Run"
5. You should see "Success. No rows returned"

**Get API Credentials:**
1. Go to Settings > API
2. Copy these values:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

### 3. Set Up Stripe (3 minutes)

**Get Test Keys:**
1. Go to https://stripe.com and sign in (or create account)
2. Make sure you're in "Test mode" (toggle in top right)
3. Go to Developers > API keys
4. Copy "Secret key" (starts with `sk_test_`)

**Set Up Webhook (do this later when deploying):**
1. Go to Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy webhook signing secret

### 4. Configure Environment Variables (1 minute)

```bash
cp .env.example .env
```

Edit `.env` file:
```env
PORT=5000
NODE_ENV=development

# From Supabase (Step 2)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# Generate a random string (or use this one for testing)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long_change_this

# From Stripe (Step 3)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Leave empty for now

# Your frontend URL
FRONTEND_URL=http://localhost:3000
```

### 5. Start the Server! (1 minute)
```bash
npm run dev
```

You should see:
```
🚀 Server running in development mode on port 5000
📍 Health check: http://localhost:5000/health
```

### 6. Test It Works

**Health Check:**
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-31T..."
}
```

**Register a User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "role": "customer"
  }'
```

Should return user data and token!

## 🎯 What You Have Now

✅ Express.js API server running  
✅ PostgreSQL database via Supabase  
✅ User authentication with JWT  
✅ Product management endpoints  
✅ Order system with escrow  
✅ Stripe payment integration  

## 📝 Next Steps

### Test the API
Use Postman, Insomnia, or Thunder Client to test:
1. Register a user
2. Login
3. Create a product (as seller)
4. Create an order
5. Confirm delivery

### Build Features
Priority order:
1. **Store Management** - Let sellers create/customize stores
2. **File Upload** - Add product image upload to Supabase Storage
3. **Courier System** - Implement delivery assignments
4. **Reviews** - Add review functionality

### Connect Frontend
Your frontend at https://escrostore.netlify.app/ can now:
- Make API calls to `http://localhost:5000/api`
- Use the token in Authorization header
- Display products, handle orders, etc.

## 🐛 Troubleshooting

**Server won't start:**
- Check all .env variables are set
- Make sure port 5000 is not in use
- Run `npm install` again

**Database errors:**
- Verify schema.sql ran successfully in Supabase
- Check SUPABASE_URL and keys are correct
- Try the Supabase SQL editor to query tables directly

**Authentication fails:**
- Ensure JWT_SECRET is set and at least 32 characters
- Check token is being sent in header: `Authorization: Bearer <token>`

**Stripe errors:**
- Make sure you're using TEST mode keys (sk_test_)
- Webhook secret can be empty during local development

## 📚 API Documentation

See README.md for complete API documentation with examples for:
- Authentication
- Products
- Orders
- Escrow payments

## 💡 Tips

- Use a REST client (Postman/Insomnia) for easier testing
- Check Supabase logs for database errors
- Monitor Stripe dashboard for payment events
- Use `npm run dev` for auto-reload during development

Happy coding! 🎉
