require('dotenv').config();
const express = require('express');
const { connectDB } = require('./db');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/adminRoutes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 30000;

// COEP başlığı ekleme - diğer middleware'lerden önce
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));

// Ana sayfa rotası
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sepet sayfası
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// API Routes
app.use('/api', apiRoutes);

// Admin rotaları için /api/admin prefix'ini kullan
app.use('/api/admin', adminRoutes);

// MongoDB bağlantısı ve sunucu başlatma
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
  });
}

startServer().catch(console.error);