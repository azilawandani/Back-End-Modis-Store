const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String }, 
  img: { type: String, required: true },
  stock: { type: Number, default: 10 },
  // PERBAIKAN: Menggunakan 'image' bukan 'code' agar sesuai dengan data dari Dashboard
  colors: [{ 
    name: { type: String }, 
    image: { type: String } 
  }],
  // PERBAIKAN: Menyimpan detail LD dan PP (Sudah Benar)
  sizes: [{
    label: { type: String }, // "M", "L", "XL", "All Size"
    ld: { type: Number },    
    pp: { type: Number }     
  }],
  features: [String] 
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);