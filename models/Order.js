const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: String, required: true },
      nama: String,
      harga: Number,
      jumlah: Number,
    }
  ],
  totalHarga: { type: Number, required: true },
  alamatPengiriman: {
    provinsi: String,
    kota: String,
    alamatLengkap: String,
  },
  status: { 
    type: String, 
    default: 'Pending',
    enum: ['Pending', 'Dikemas', 'Dikirim', 'Selesai'] 
  },
  trackingHistory: [
    {
      keterangan: { type: String, required: true },
      lokasi: { type: String },
      waktu: { type: Date, default: Date.now }
    }
  ],
  tanggalOrder: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);