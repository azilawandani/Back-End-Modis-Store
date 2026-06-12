const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/order');
const productRoutes = require('./routes/product');

const app = express();

// --- 1. MIDDLEWARE ---
// PERBAIKAN: Memperbaiki penulisan konfigurasi objek CORS dan menghapus tanda "/" di akhir URL
app.use(cors({
  origin: 'https://front-end-modis-store-a5yo.vercel.app', 
  credentials: true
}));

app.use(express.json()); // Agar bisa membaca data JSON dari body request

// --- 2. ROUTES ---
// Daftarkan semua endpoint API di sini
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

// Route Testing untuk memastikan server jalan
app.get('/', (req, res) => {
  res.send('API Modis Store Berjalan...');
});

// --- 3. KONEKSI DATABASE ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Terhubung ke MongoDB Atlas');
    
    // Jalankan Server setelah database terkoneksi
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server aktif di port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Gagal koneksi ke MongoDB:', err);
  });