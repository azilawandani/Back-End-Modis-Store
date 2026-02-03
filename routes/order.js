const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// -----------------------------------------------------------
// 1. MEMBUAT PESANAN BARU (Checkout)
// -----------------------------------------------------------
router.post('/checkout', async (req, res) => {
  try {
    const { userId, items, totalHarga, alamatPengiriman } = req.body;
    
    const newOrder = new Order({
      userId,
      items,
      totalHarga,
      alamatPengiriman,
      status: 'Pending', // Status awal saat pesanan dibuat
      trackingHistory: [
        {
          keterangan: "Pesanan Berhasil Dibuat",
          lokasi: "Sistem Modis Store"
        }
      ]
    });

    await newOrder.save();
    res.status(201).json({ message: "Pesanan berhasil dibuat!", order: newOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -----------------------------------------------------------
// 2. MELIHAT RIWAYAT PESANAN PER USER (Daftar Pesanan)
// -----------------------------------------------------------
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -----------------------------------------------------------
// 3. AMBIL DETAIL PESANAN UNTUK PELACAKAN (Lacak Paket)
// -----------------------------------------------------------
router.get('/track/:orderId', async (req, res) => {
  try {
    // Mencari satu pesanan spesifik berdasarkan ID uniknya
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }
    
    res.json(order);
  } catch (err) {
    // Menangani error jika ID yang dimasukkan salah format (CastError)
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: "ID Pesanan tidak valid" });
    }
    res.status(500).json({ message: err.message });
  }
});

// -----------------------------------------------------------
// 4. KONFIRMASI PESANAN SELESAI (Update Status)
// -----------------------------------------------------------
router.put('/confirm-finish/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'Selesai' }, 
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    res.status(200).json({ 
      message: "Pesanan telah diselesaikan!", 
      order: updatedOrder 
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui status", error: error.message });
  }
});

module.exports = router;