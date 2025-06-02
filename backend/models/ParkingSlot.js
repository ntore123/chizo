const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slotStatus: {
    type: String,
    enum: ['Available', 'Occupied'],
    default: 'Available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
