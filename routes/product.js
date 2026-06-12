const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// --- TAMBAH PRODUK BARU ---
router.post('/add', async (req, res) => {
  try {
    const existingProduct = await Product.findOne({ slug: req.body.slug });
    if (existingProduct) {
      return res.status(400).json({ message: "Nama produk sudah ada, gunakan nama lain agar slug unik." });
    }

    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save(); 
    
    res.status(201).json({ 
      message: "Produk Berhasil Ditambahkan", 
      product: savedProduct 
    });
  } catch (error) {
    // SANGAT PENTING: Cek terminal backend kamu untuk melihat pesan error ini
    console.error("DETEKSI ERROR BACKEND:", error.message);
    res.status(400).json({ message: "Gagal menambah produk: " + error.message });
  }
});


// --- AMBIL SEMUA PRODUK ---
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- AMBIL SATU PRODUK BERDASARKAN SLUG ---
router.get('/detail/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- UPDATE PRODUK ---
router.put('/update/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true } // Menambahkan runValidators agar input baru divalidasi
    );
    if (!updatedProduct) return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json({ message: "Produk berhasil diperbarui", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- HAPUS PRODUK ---
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "ID Produk tidak ditemukan" });
    res.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;