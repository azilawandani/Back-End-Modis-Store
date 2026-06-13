const User = require('../models/User');

/**
 * FUNGSI HELPER: LOGIKA REKOMENDASI UKURAN & DETAIL FISIK
 * Berdasarkan hasil rekayasa kebutuhan Modis Store (Integrasi TB & BB)
 * Menghasilkan Label Ukuran, Estimasi LD, dan Estimasi PP
 */
const hitungDetailFisik = (tb, bb) => {
  const tinggi = Number(tb);
  const berat = Number(bb);

  if (!tinggi || !berat || tinggi <= 0 || berat <= 0) {
    return { label: "Input Tidak Valid", ld: 0, pp: 0 };
  }

  // Logika estimasi LD & PP sesuai standar Modis Store
  let estLD = Math.round((berat * 1.2) + (tinggi * 0.15) + 15);
  let estPP = Math.round(tinggi * 0.45);

  let label = "All Size";
 if ((berat >= 50 && berat < 60) || (tinggi >= 155 && tinggi < 165)) {
    label = "M";
  } else if ((berat >= 60 && berat < 75) || (tinggi >= 165 && tinggi < 175)) {
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
        // Mengambil ID dari params atau dari middleware auth
        const userId = req.params.id || req.user.id; 
        
        const { 
            nama, phone, province, city, district, postalCode, address, location,
            tinggiBadan, beratBadan, 
            warnaFavorit, gayaPakaian, motifDisukai, favBahan,
            kategoriFavorit 
        } = req.body;

        // Hitung ulang detail fisik lengkap (Label, LD, PP) berdasarkan data terbaru
        const detailFisik = hitungDetailFisik(tinggiBadan, beratBadan);

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
                    tinggiBadan: Number(tinggiBadan),
                    beratBadan: Number(beratBadan),
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
        );

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
 * 2. FUNGSI LOGIN
 * Memastikan seluruh objek profiling (termasuk LD & PP) ikut terkirim
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Cari user berdasarkan email
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email tidak terdaftar" });

        /** 
         * NOTE: Tambahkan logika bcrypt.compare(password, user.password) di sini 
         * sebelum proses login dinyatakan berhasil.
         */

        // Jika password cocok, kirim response lengkap termasuk objek profiling terbaru
        res.status(200).json({
            message: "Login Berhasil",
            token: "YOUR_JWT_TOKEN_HERE", 
            user: {
                id: user._id,
                nama: user.nama,
                email: user.email,
                phone: user.phone,
                province: user.province,
                city: user.city,
                district: user.district,
                postalCode: user.postalCode,
                address: user.address,
                location: user.location,
                // Mengirimkan objek profiling lengkap agar LD/PP muncul saat user pindah halaman
                profiling: user.profiling 
            }
        });
    } catch (error) {
        console.error("Error pada Backend Login:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};