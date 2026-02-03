const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Tambahkan field di bawah ini
  phone: { type: String, default: "" },
  province: { type: String, default: "" },
  city: { type: String, default: "" },
  address: { type: String, default: "" },
  location: {
    lat: { type: Number, default: 0.5071 },
    lng: { type: Number, default: 101.4478 }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);