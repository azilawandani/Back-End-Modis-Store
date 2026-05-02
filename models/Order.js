const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true }, 
  namaPelanggan: { type: String, required: true },
  items: [
    {
      productId: { type: String, required: true },
      nama: String,
      harga: Number,
      jumlah: Number,
      varian: String
    }
  ],
  totalHarga: { type: Number, required: true },
  ongkir: { type: Number, default: 0 }, 
  noResi: { type: String, default: "" },
  alamatPengiriman: {
    alamatLengkap: { type: String, required: true }
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