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
const hitungDetailFisik = (tb, bb) => {
  const tinggi = Number(tb);
  const berat = Number(bb);

  if (!tinggi || !berat || tinggi <= 0 || berat <= 0) {
    return { label: "Input Tidak Valid", ld: 0, pp: 0 };
  }

  // Logika rumus skripsi: Estimasi LD & PP
  let estLD = Math.round((berat * 1.2) + (tinggi * 0.15) + 15);
  let estPP = Math.round(tinggi * 0.45);

  let label = "M";
  
  if (berat >= 45 && berat < 55) {
    label = "M";
  } else if (berat >= 55 && berat < 65) {
    label = "L";
  } else if (berat >= 65 && berat <= 80) {
    label = "XL";
  } else if (berat > 80) {
    label = "XL";
  } else {
    label = "M";
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

// --- 2. LOGIN (PERBAIKAN: Mengirim profiling lengkap) ---
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
        // PERBAIKAN: Mengirim objek profiling lengkap dari database agar LD/PP tetap tersimpan
        profiling: user.profiling || {} 
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 3. UPDATE PROFILE (PERBAIKAN: Sinkronisasi data ke Frontend) ---
router.put('/update/:id', async (req, res) => {
  try {
    const { 
        nama, name, phone, province, city, district, postalCode, address, location,
        tinggiBadan, beratBadan, warnaFavorit, gayaPakaian, motifDisukai, favBahan, kategoriFavorit
    } = req.body;

    const finalNama = nama || name;
    
    // Hitung detail fisik otomatis (Label, LD, PP) sesuai rumus
    const detailFisik = hitungDetailFisik(tinggiBadan, beratBadan);

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
            tinggiBadan: Number(tinggiBadan) || 0,
            beratBadan: Number(beratBadan) || 0,
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

    // Kirim response lengkap agar Frontend bisa langsung update LocalStorage
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
            profiling: updatedUser.profiling // Mengirim hasil hitungan terbaru
        }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;