const mongoose = require('mongoose');

const parkingRecordSchema = new mongoose.Schema({
  slotNumber: {
    type: String,
    required: true,
    ref: 'ParkingSlot'
  },
  plateNumber: {
    type: String,
    required: true,
    ref: 'Car'
  },
  entryTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  exitTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Completed'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Calculate duration when exitTime is set
parkingRecordSchema.pre('save', function(next) {
  if (this.exitTime && this.entryTime) {
    // Calculate duration in minutes
    const durationMs = this.exitTime - this.entryTime;
    this.duration = Math.ceil(durationMs / (1000 * 60));
    this.status = 'Completed';
  }
  next();
});

module.exports = mongoose.model('ParkingRecord', parkingRecordSchema);
