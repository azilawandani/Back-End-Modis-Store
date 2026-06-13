const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * FUNGSI HELPER: LOGIKA REKOMENDASI UKURAN & DETAIL FISIK
 * Berdasarkan hasil rekayasa kebutuhan Modis Store (Integrasi TB & BB)
 * Menghasilkan Label Ukuran, Estimasi LD, dan Estimasi PP
 */
const hitungDetailFisik = (tinggi, berat) => {
  // Amankan input: jika bernilai 0, null, atau NaN, langsung return default
  if (!tinggi || !berat || isNaN(tinggi) || isNaN(berat)) {
    return { label: "Belum Diatur", ld: 0, pp: 0 };
  }

  // 1. Rumus Estimasi LD & PP sesuai kodingan Modis Store
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

/**
 * 1. FUNGSI UPDATE PROFILING & ALAMAT
 * Digunakan saat user klik 'Simpan Perubahan' di halaman Profile.jsx
 */
exports.updateProfiling = async (req, res) => {
    try {
        // Mengambil ID dari params atau dari middleware auth token
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

        // Sanitasi data: Pastikan dikonversi ke angka murni. Jika kosong/invalid, default ke 0
        const tbAngka = Number(tinggiBadan) || 0;
        const bbAngka = Number(beratBadan) || 0;

        // Hitung ulang detail fisik lengkap (Label, LD, PP) berdasarkan angka sanitasi
        const detailFisik = hitungDetailFisik(tbAngka, bbAngka);

        // Update data ke MongoDB dengan field LD dan PP yang baru
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
                    rekomendasiUkuran: detailFisik.label, // Menyimpan Label (S/M/L/XL)
                    estimasiLD: detailFisik.ld,           // Menyimpan angka LD permanen
                    estimasiPP: detailFisik.pp,           // Menyimpan angka PP permanen
                    warnaFavorit: warnaFavorit || "",
                    favBahan: favBahan || "", 
                    gayaPakaian: gayaPakaian || "",
                    motifDisukai: motifDisukai || "",
                    kategoriFavorit: kategoriFavorit || "" 
                }
            },
            { new: true } // Mengembalikan dokumen yang sudah diupdate
        ).select('-password'); // Amankan password agar tidak ikut terkirim ke frontend

        if (!updatedUser) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Kirim balik data user terbaru agar Frontend bisa update localStorage tanpa kehilangan LD/PP
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
 * 2. FUNGSI LOGIN (FIXED & SECURE)
 * Memastikan verifikasi password berjalan nyata dan mengirim data profiling lengkap
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Cari user berdasarkan email
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email tidak terdaftar" });

        // 2. Verifikasi Password menggunakan bcrypt secara nyata
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Password yang Anda masukkan salah!" });

        // 3. Generate JWT Token resmi berdasarkan ID User
        const tokenSecret = process.env.JWT_SECRET || 'secretkeymodis';
        const token = jwt.sign({ id: user._id }, tokenSecret, { expiresIn: '1d' });

        // 4. Kirim response sukses lengkap ke frontend
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
                // Mengirimkan objek profiling lengkap agar LD/PP muncul di Profile.jsx
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