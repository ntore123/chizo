const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  parkingRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'ParkingRecord'
  },
  amountPaid: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
