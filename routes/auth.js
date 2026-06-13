const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Helper untuk hitung ukuran cerdas (Integrasi TB & BB)
 * Logika ini sinkron dengan yang ada di Frontend (Profile.jsx)
 * Menghasilkan Label Ukuran, Estimasi LD, dan Estimasi PP
 */
const estimasiFisikModisStore = (tinggi, berat) => {
  if (!tinggi || !berat) return { label: "All Size", ld: 0, pp: 0 };

  // 1. Rumus Estimasi LD & PP bawaan kodinganmu
  let estLD = Math.round((berat * 1.2) + (tinggi * 0.15) + 15);
  let estPP = Math.round(tinggi * 0.45);

  let label = "All Size";

  // 2. Logika Penentuan Label Ukuran (Menggunakan Rentang Gabungan yang Logis)
  if (berat < 50 && tinggi < 155) {
    label = "S";
  } else if (berat >= 50 && berat < 60 && tinggi >= 155 && tinggi < 165) {
    label = "M";
  } else if (berat >= 60 && berat < 75 && tinggi >= 165 && tinggi < 175) {
    label = "L";
  } else if (berat >= 75 || tinggi >= 175) {
    label = "XL";
  }
  
  return { label, ld: estLD, pp: estPP };
};

// --- 1. REGISTER ---
router.post('/register', async (req, res) => {
  try {
    const { nama, email, password } = req.body;

    let userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ message: "Email sudah terdaftar!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ 
        nama, 
        email, 
        password: hashedPassword,
        role: 'user',
        // Inisialisasi profiling kosong agar tidak error saat pertama kali login
        profiling: {
          tinggiBadan: 0,
          beratBadan: 0,
          rekomendasiUkuran: "Belum Diatur",
          estimasiLD: 0,
          estimasiPP: 0
        }
    });
    
    await newUser.save();
    res.status(201).json({ message: "Registrasi Berhasil! Silakan Login." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 2. LOGIN ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email tidak ditemukan!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Password salah!" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkeymodis', { expiresIn: '1d' });

    res.json({
      token,
      user: { 
        id: user._id, 
        nama: user.nama, 
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        province: user.province || "",
        city: user.city || "",
        district: user.district || "",   
        postalCode: user.postalCode || "", 
        address: user.address || "", 
        location: user.location || {},
        profiling: user.profiling || {} 
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 3. UPDATE PROFILE (SINKRON & FIXED) ---
router.put('/update/:id', async (req, res) => {
  try {
    const { 
        nama, name, phone, province, city, district, postalCode, address, location,
        tinggiBadan, beratBadan, warnaFavorit, gayaPakaian, motifDisukai, favBahan, kategoriFavorit
    } = req.body;

    const finalNama = nama || name;
    
    // Pastikan input dikonversi menjadi angka murni sebelum dilempar ke rumus
    const tbAngka = Number(tinggiBadan) || 0;
    const bbAngka = Number(beratBadan) || 0;

    // PERBAIKAN: Memanggil nama fungsi helper yang benar
    const detailFisik = estimasiFisikModisStore(tbAngka, bbAngka);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { 
        nama: finalNama, 
        phone, 
        province, 
        city, 
        district,     
        postalCode,   
        address, 
        location,
        profiling: {
            tinggiBadan: tbAngka,
            beratBadan: bbAngka,
            rekomendasiUkuran: detailFisik.label,
            estimasiLD: detailFisik.ld, 
            estimasiPP: detailFisik.pp, 
            warnaFavorit: warnaFavorit || "",
            favBahan: favBahan || "",
            kategoriFavorit: kategoriFavorit || "",
            gayaPakaian: gayaPakaian || "",
            motifDisukai: motifDisukai || ""
        }
      },
      { new: true } 
    );

    if (!updatedUser) return res.status(404).json({ message: "User tidak ditemukan" });

    res.status(200).json({ 
        message: "Update Sukses", 
        user: {
            id: updatedUser._id,
            nama: updatedUser.nama,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone || "",
            province: updatedUser.province || "",
            city: updatedUser.city || "",
            district: updatedUser.district || "",   
            postalCode: updatedUser.postalCode || "", 
            address: updatedUser.address || "",
            location: updatedUser.location || {},
            profiling: updatedUser.profiling 
        }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;