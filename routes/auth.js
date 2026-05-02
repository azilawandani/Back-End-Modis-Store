const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper untuk hitung ukuran agar sinkron dengan Profile
const hitungRekomendasiUkuran = (bb) => {
  const berat = Number(bb);
  if (!berat) return "";
  if (berat < 45) return "S";
  if (berat >= 45 && berat < 55) return "M";
  if (berat >= 55 && berat < 65) return "L";
  if (berat >= 65) return "XL";
  return "All Size";
};

// --- 1. REGISTER ---
router.post('/register', async (req, res) => {
  try {
    const { nama, email, password } = req.body;

    // Cek apakah email sudah terdaftar
    let userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ message: "Email sudah terdaftar!" });

    // Enkripsi password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buat user baru (Otomatis role: user)
    const newUser = new User({ 
        nama, 
        email, 
        password: hashedPassword,
        role: 'user' 
    });
    
    await newUser.save();
    console.log("✅ User Baru Tersimpan:", email);

    res.status(201).json({ message: "Registrasi Berhasil! Silakan Login." });
  } catch (error) {
    console.error("❌ Register Error:", error.message);
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
        name: user.nama, 
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        province: user.province || "",
        city: user.city || "",
        district: user.district || "",   // Kirim district saat login
        postalCode: user.postalCode || "", // Kirim postalCode saat login
        address: user.address || "", 
        location: user.location,
        profiling: user.profiling || {} 
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 3. UPDATE PROFILE ---
router.put('/update/:id', async (req, res) => {
  try {
    const { 
        nama, name, phone, province, city, district, postalCode, address, location,
        tinggiBadan, beratBadan, warnaFavorit, gayaPakaian, motifDisukai, favBahan 
    } = req.body;

    const finalNama = nama || name;
    const rekomendasiUkuran = hitungRekomendasiUkuran(beratBadan);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { 
        nama: finalNama, 
        phone, 
        province, 
        city, 
        district,    // Simpan district
        postalCode,  // Simpan postalCode
        address, 
        location,
        profiling: {
            tinggiBadan: Number(tinggiBadan) || 0,
            beratBadan: Number(beratBadan) || 0,
            rekomendasiUkuran: rekomendasiUkuran,
            warnaFavorit: warnaFavorit || "",
            favBahan: favBahan || "",
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
            name: updatedUser.nama,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            province: updatedUser.province,
            city: updatedUser.city,
            district: updatedUser.district,   // Kembalikan data district yang baru
            postalCode: updatedUser.postalCode, // Kembalikan data postalCode yang baru
            address: updatedUser.address,
            location: updatedUser.location,
            profiling: updatedUser.profiling
        }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;