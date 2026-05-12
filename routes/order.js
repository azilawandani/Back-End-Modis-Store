const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// -----------------------------------------------------------
// 1. MEMBUAT PESANAN BARU (Checkout)
// -----------------------------------------------------------
router.post('/checkout', async (req, res) => {
  try {
    const { userId, namaPelanggan, items, totalHarga, ongkir, alamatPengiriman, noResi } = req.body;
    
    // Validasi Dasar
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Item pesanan tidak boleh kosong" });
    }

    const newOrder = new Order({
      userId,
      namaPelanggan, 
      items,
      totalHarga,
      ongkir,
      noResi: noResi || "",
      alamatPengiriman,
      status: 'Pending',
      trackingHistory: [
        {
          keterangan: "Pesanan Berhasil Dibuat",
          lokasi: "Sistem Modis Store",
          waktu: new Date()
        }
      ]
    });

    const savedOrder = await newOrder.save();

    // PROSES UPDATE STOK
    const updateStockPromises = items.map(item => {
      // Pastikan quantity adalah angka dan tidak undefined
      const qtyToReduce = Number(item.quantity) || 0;
      
      return Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -qtyToReduce } }, 
        { new: true }
      );
    });

    await Promise.all(updateStockPromises);

    res.status(201).json({ 
      message: "Pesanan berhasil dibuat dan stok diperbarui!", 
      order: savedOrder 
    });
  } catch (err) {
    console.error("Backend Order Error:", err);
    res.status(500).json({ message: "Gagal memproses pesanan: " + err.message });
  }
});

// -----------------------------------------------------------
// 2. MELIHAT SEMUA PESANAN (KHUSUS ADMIN)
// -----------------------------------------------------------
router.get('/all', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'email phone') 
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -----------------------------------------------------------
// 3. MELIHAT RIWAYAT PESANAN PER USER
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
// 4. AMBIL DETAIL PESANAN UNTUK PELACAKAN
// -----------------------------------------------------------
router.get('/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -----------------------------------------------------------
// 5. UPDATE STATUS PESANAN (ADMIN)
// -----------------------------------------------------------
router.put('/update-status/:id', async (req, res) => {
  try {
    const { status, keterangan, lokasi } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status: status,
        $push: { trackingHistory: { keterangan, lokasi, waktu: new Date() } }
      },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -----------------------------------------------------------
// 6. HAPUS SEMUA TRANSAKSI (RESET DATA KE 0)
// -----------------------------------------------------------
router.delete('/delete-all', async (req, res) => {
  try {
    await Order.deleteMany({});
    res.status(200).json({ message: "Semua data transaksi berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -----------------------------------------------------------
// 7. KONFIRMASI PESANAN SELESAI (USER)
// -----------------------------------------------------------
router.put('/confirm-finish/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Selesai',
        $push: { 
          trackingHistory: { 
            keterangan: "Pesanan telah diterima oleh pelanggan", 
            lokasi: "Lokasi Pelanggan", 
            waktu: new Date() 
          } 
        }
      },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    res.status(200).json({ message: "Status diperbarui menjadi Selesai", order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;