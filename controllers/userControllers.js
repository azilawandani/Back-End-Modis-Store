const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * FUNGSI HELPER: LOGIKA REKOMENDASI UKURAN & DETAIL FISIK
 * Berdasarkan hasil rekayasa kebutuhan Modis Store (Murni Range Berat Badan Sesuai Katalog)
 * Menghasilkan Label Ukuran, Estimasi LD, dan Estimasi PP
 */
const hitungDetailFisik = (tb, bb) => {
  const tinggi = parseInt(tb);
  const berat = parseInt(bb);

  if (!tinggi || !berat || tinggi <= 0 || berat <= 0 || isNaN(tinggi) || isNaN(berat)) {
    return { label: "Input Tidak Valid", ld: 0, pp: 0 };
  }

  // PERBAIKAN: Konstanta dikunci + 10 agar TB 160 / BB 55 pas menghasilkan LD 100 cm (Batas 100% Match)
  let estLD = Math.round((berat * 1.2) + (tinggi * 0.15) + 10);
  let estPP = Math.round(tinggi * 0.45); 

  let label = "M"; 
  
  // Penentuan Label Ukuran Sinkron dengan Data Tabel Katalog Butik
  if (berat < 45) {
    label = "S";
  } else if (berat >= 45 && berat < 55) {
    label = "M";
  } else if (berat >= 55 && berat < 65) {
    label = "L";
  } else if (berat >= 65) {
    label = "XL"; 
  }

  return { label, ld: estLD, pp: estPP };
};

/**
 * 1. FUNGSI UPDATE PROFILING & ALAMAT
 * Digunakan saat user klik 'Simpan Perubahan' di halaman Profile.jsx
 */
exports.updateProfiling = async (req, res) => {
    try {
        const userId = req.params.id || (req.user ? req.user.id : null); 
        
        if (!userId) {
            return res.status(400).json({ message: "ID Pengguna tidak valid atau tidak ditemukan" });
        }

        const { 
            nama, phone, province, city, district, postalCode, address, location,
            tinggiBadan, beratBadan, 
            warnaFavorit, gayaPakaian, motifDisukai, favBahan,
            kategoriFavorit 
        } = req.body;

        const tbAngka = parseInt(tinggiBadan) || 0;
        const bbAngka = parseInt(beratBadan) || 0;

        // Hitung ulang detail fisik dengan fungsi terstandarisasi
        const detailFisik = hitungDetailFisik(tbAngka, bbAngka);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                nama, 
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
                    gayaPakaian: gayaPakaian || "",
                    motifDisukai: motifDisukai || "",
                    kategoriFavorit: kategoriFavorit || "" 
                }
            },
            { new: true } 
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        res.status(200).json({
            message: "Profil & Data Rekomendasi Berhasil Diperbarui",
            user: updatedUser 
        });
    } catch (error) {
        console.error("Error pada Backend Update Profiling:", error);
        res.status(500).json({ 
            message: "Gagal memperbarui data profiling", 
            error: error.message 
        });
    }
};

/**
 * 2. FUNGSI LOGIN
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email tidak terdaftar" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Password yang Anda masukkan salah!" });

        const tokenSecret = process.env.JWT_SECRET || 'secretkeymodis';
        const token = jwt.sign({ id: user._id }, tokenSecret, { expiresIn: '1d' });

        res.status(200).json({
            message: "Login Berhasil",
            token, 
            user: {
                id: user._id,
                nama: user.nama,
                email: user.email,
                role: user.role || "user",
                phone: user.phone || "",
                province: user.province || "",
                city: user.city || "",
                district: user.district || "",
                postalCode: user.postalCode || "",
                address: user.address || "",
                location: user.location || {},
                profiling: user.profiling || {
                    tinggiBadan: 0,
                    beratBadan: 0,
                    rekomendasiUkuran: "Belum Diatur",
                    estimasiLD: 0,
                    estimasiPP: 0
                }
            }
        });
    } catch (error) {
        console.error("Error pada Backend Login:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};