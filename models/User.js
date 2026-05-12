const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Role untuk memisahkan akses Admin dan User
  role: { type: String, default: "user", enum: ["user", "admin"] }, 
  
  phone: { type: String, default: "" },
  province: { type: String, default: "" },
  city: { type: String, default: "" },
  district: { type: String, default: "" },   
  postalCode: { type: String, default: "" }, 
  
  // Field address ini akan kita gunakan sebagai 'Alamat Lengkap'
  address: { type: String, default: "" },
  
  location: {
    lat: { type: Number, default: 0.5071 },
    lng: { type: Number, default: 101.4478 }
  },

  // DATA PROFILING UNTUK ALGORITMA REKOMENDASI (INTI SKRIPSI)
  profiling: {
    tinggiBadan: { type: Number, default: 0 },
    beratBadan: { type: Number, default: 0 },
    rekomendasiUkuran: { type: String, default: "" },
    
    // FIELD BARU: Agar LD & PP tersimpan permanen di Database
    estimasiLD: { type: Number, default: 0 }, 
    estimasiPP: { type: Number, default: 0 },
    
    warnaFavorit: { type: String, default: "" }, 
    favBahan: { type: String, default: "" }, 
    kategoriFavorit: { type: String, default: "" }, 
    gayaPakaian: { type: String, default: "" },    
    motifDisukai: { type: String, default: "" }    
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);