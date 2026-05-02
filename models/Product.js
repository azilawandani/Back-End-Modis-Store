const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String }, 
  img: { type: String, required: true },
  stock: { type: Number, default: 10 },
  colors: [{ 
    name: { type: String }, 
    code: { type: String } 
  }],
  sizes: [String], // Menyimpan "S", "M", "L", "XL", atau "All Size" dari Excel
  // Features: [0]=Bahan, [1]=Gaya, [2]=Motif (Pattern/Polos)
  features: [String] 
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);