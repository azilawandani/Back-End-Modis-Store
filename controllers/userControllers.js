const User = require('../models/User');

/**
 * Fungsi Helper Hitung Ukuran
 * Logika Azila: < 45kg = S, 45-54kg = M, 55-64kg = L, >= 65kg = XL
 */
const hitungRekomendasiUkuran = (tb, bb) => {
    const berat = Number(bb);
    if (!berat) return ""; 

    if (berat < 45) return "S";
    if (berat >= 45 && berat < 55) return "M";
    if (berat >= 55 && berat < 65) return "L";
    if (berat >= 65) return "XL";
    return "All Size";
};

// 1. FUNGSI UPDATE PROFILING (Agar data tersimpan permanen ke MongoDB)
exports.updateProfiling = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { 
            nama, phone, province, city, address, location,
            tinggiBadan, beratBadan, 
            warnaFavorit, gayaPakaian, motifDisukai, favBahan 
        } = req.body;

        const rekomendasiUkuran = hitungRekomendasiUkuran(Number(tinggiBadan), Number(beratBadan));

        // Menggunakan findByIdAndUpdate dengan opsi { new: true } agar mengembalikan data terbaru
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                nama, phone, province, city, address, location,
                profiling: {
                    tinggiBadan: Number(tinggiBadan),
                    beratBadan: Number(beratBadan),
                    rekomendasiUkuran: rekomendasiUkuran,
                    warnaFavorit: warnaFavorit || "",
                    favBahan: favBahan || "", 
                    gayaPakaian: gayaPakaian || "",
                    motifDisukai: motifDisukai || ""
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Response ini akan diterima React untuk mengupdate localStorage secara real-time
        res.status(200).json({
            message: "Profiling Berhasil Diperbarui secara permanen",
            user: updatedUser 
        });
    } catch (error) {
        console.error("Error Backend:", error);
        res.status(500).json({ message: "Gagal memperbarui profiling", error: error.message });
    }
};

// 2. FUNGSI LOGIN (Sangat Penting: Mengambil data dari MongoDB saat user masuk kembali)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Cari user di database
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

        // (Pastikan logika pengecekan password/bcrypt kamu di sini tetap ada)

        /**
         * KUNCI AGAR DATA TIDAK HILANG SAAT LOGOUT:
         * Kita harus mengirimkan seluruh objek 'profiling' kembali ke React
         * sehingga React bisa menyimpannya lagi di localStorage setelah login.
         */
    res.status(200).json({
            token: rahasia_banget_123,
            user: {
                id: user._id,
                nama: user.nama,
                email: user.email,
                phone: user.phone,
                // Pastikan alamat dikirim lengkap
                province: user.province,
                city: user.city,
                address: user.address,
                location: user.location,
                // Pastikan seluruh objek profiling dikirim
                profiling: user.profiling 
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};