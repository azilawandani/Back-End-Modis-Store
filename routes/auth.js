const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. DAFTAR (REGISTER)
router.post('/register', async (req, res) => {
  try {
    const { nama, email, password } = req.body;

    // Cek apakah email sudah terpakai
    let userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ message: "Email sudah terdaftar!" });

    // Enkripsi Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan ke Database
    const newUser = new User({ nama, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Registrasi Berhasil!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. MASUK (LOGIN)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari User
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email tidak ditemukan!" });

    // Cek Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Password salah!" });

    // Buat Token Keamanan (JWT)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: { id: user._id, nama: user.nama, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  // ENDPOINT UPDATE PROFILE
router.put('/update/:id', async (req, res) => {
  try {
    const { nama, phone, province, city, address, location } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, // Ini mengambil :id dari URL
      { nama, phone, province, city, address, location },
      { new: true }
    );
    res.status(200).json({ message: "Update Sukses", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
});



module.exports = router;