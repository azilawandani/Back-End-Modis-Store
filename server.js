const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/order');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Agar server bisa membaca data format JSON
app.use('/api/orders', orderRoutes);
// Koneksi ke MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Terhubung ke MongoDB Atlas'))
  .catch((err) => console.error('❌ Gagal koneksi ke MongoDB:', err));

// Route Testing
app.get('/', (req, res) => {
  res.send('API Modis Store Berjalan...');
});
app.use('/api/auth', authRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server aktif di http://localhost:${PORT}`);
});