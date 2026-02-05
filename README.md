# AAZ International - B2B Medical Equipment Platform

A complete full-stack e-commerce platform designed for B2B medical equipment suppliers, hospitals, clinics, and diagnostic centers.

![Status](https://img.shields.io/badge/Status-In%20Development-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)
![Node](https://img.shields.io/badge/Node-v24.x-green)
![React](https://img.shields.io/badge/React-v18.x-blue)

## 📋 Overview

AAZ International is a professional B2B platform for medical equipment procurement, featuring:

- Simplified payment system (Card + Cash on Delivery)
- Real-time order tracking with Socket.io
- Admin dashboard for order and product management
- Legal compliance pages (Privacy Policy, Terms, Medical Disclaimer)
- Secure authentication with JWT
- Email notifications
- Mobile-responsive design

## 🚀 Features

### For Customers

- ✅ Browse medical equipment products
- ✅ Add to cart and checkout
- ✅ Multiple payment methods (Card via Stripe, COD)
- ✅ Order tracking in real-time
- ✅ Order history and details
- ✅ Wishlist management
- ✅ Product reviews and ratings
- ✅ User profile management

### For Admin

- ✅ Dashboard with analytics
- ✅ Order management (view, update status)
- ✅ Product management (add, edit, delete)
- ✅ Category management
- ✅ Customer management
- ✅ Order status updates

### Security & Compliance

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Server-side validation
- ✅ CORS protection
- ✅ Rate limiting
- ✅ MongoDB injection prevention
- ✅ Secure file uploads
- ✅ Legal compliance pages

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time updates
- **Stripe** - Payment processing
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Frontend

- **React** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Socket.io Client** - Real-time updates
- **CSS3** - Styling

## 📁 Project Structure

```
AAZ-inter/
├── backend/
│   ├── config/           # Database config
│   ├── controllers/      # Business logic
│   ├── middleware/       # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── admin/       # Admin dashboard
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context
│   │   ├── pages/       # Page components
│   │   └── App.jsx      # Main component
│   └── index.html       # HTML entry
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn
- Stripe account (for card payments)
- Gmail account (for emails)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/badshahjan123/AAZ-inter.git
cd AAZ-inter
```

2. **Setup Backend**

```bash
cd backend
npm install
```

3. **Create .env file** (backend)

```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Setup Frontend**

```bash
cd ../frontend
npm install
```

5. **Start Backend**

```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

6. **Start Frontend**

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

## 🔑 Environment Variables

### Backend (.env)

```
# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Frontend
FRONTEND_URL=http://localhost:5173

# Admin
ADMIN_EMAIL=admin@aazinternational.com
ADMIN_PASSWORD=your_secure_password
```

## 📚 API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders

- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (admin)

### Payments

- `POST /api/stripe/create-payment-intent` - Create Stripe payment intent

## 📝 Database Models

- **User** - Customer accounts
- **Admin** - Admin accounts
- **Product** - Medical equipment
- **Category** - Product categories
- **Order** - Customer orders
- **Review** - Product reviews
- **Wishlist** - User wishlists

## 🔐 Security Features

- Server-side validation on all inputs
- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Helmet security headers
- Rate limiting on API endpoints
- MongoDB injection prevention
- Secure file upload handling
- HTTPS ready (production)

## 📋 Payment Methods

1. **Credit/Debit Card** - Stripe integration
2. **Cash on Delivery** - COD orders

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd ../frontend
npm run test
```

## 📦 Deployment

### Backend (Node.js)

- Deploy to Heroku, Railway, Render, or any Node.js hosting
- Set production environment variables
- Use MongoDB Atlas for cloud database

### Frontend (React/Vite)

- Build: `npm run build`
- Deploy to Vercel, Netlify, or any static hosting
- Update API endpoints for production

## 📞 Support & Contact

- **Email:** support@aazinternational.com
- **Medical Inquiries:** medical@aazinternational.com
- **WhatsApp:** +92 300 1234567
- **Website:** www.aazinternational.com

## 📄 Legal

- [Privacy Policy](/frontend/src/pages/PrivacyPolicy.jsx)
- [Terms & Conditions](/frontend/src/pages/TermsConditions.jsx)
- [Medical Disclaimer](/frontend/src/pages/MedicalDisclaimer.jsx)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and owned by AAZ International. Unauthorized copying or redistribution is prohibited.

## 👨‍💻 Author

- **Badshah Jan** - badshahkha656@gmail.com
- GitHub: [@badshahjan123](https://github.com/badshahjan123)

---

**Last Updated:** February 3, 2026

Made with ❤️ for medical professionals
