const ParkingRecord = require('../models/ParkingRecord');
const ParkingSlot = require('../models/ParkingSlot');
const Car = require('../models/Car');

// Get all parking records
exports.getAllParkingRecords = async (req, res) => {
  try {
    const parkingRecords = await ParkingRecord.find().sort({ entryTime: -1 });
    res.status(200).json(parkingRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single parking record
exports.getParkingRecord = async (req, res) => {
  try {
    const parkingRecord = await ParkingRecord.findById(req.params.id);
    if (!parkingRecord) {
      return res.status(404).json({ message: 'Parking record not found' });
    }
    res.status(200).json(parkingRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new parking record (car entry)
exports.createParkingRecord = async (req, res) => {
  try {
    const { slotNumber, plateNumber, driverName, phoneNumber } = req.body;
    
    // Check if slot exists and is available
    const parkingSlot = await ParkingSlot.findOne({ slotNumber });
    if (!parkingSlot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }
    
    if (parkingSlot.slotStatus === 'Occupied') {
      return res.status(400).json({ message: 'Parking slot is already occupied' });
    }
    
    // Check if car exists, if not create it
    let car = await Car.findOne({ plateNumber });
    if (!car) {
      car = new Car({
        plateNumber,
        driverName,
        phoneNumber
      });
      await car.save();
    } else {
      // Update driver info if needed
      if (driverName || phoneNumber) {
        car.driverName = driverName || car.driverName;
        car.phoneNumber = phoneNumber || car.phoneNumber;
        await car.save();
      }
    }
    
    // Create parking record
    const newParkingRecord = new ParkingRecord({
      slotNumber,
      plateNumber,
      entryTime: new Date(),
      status: 'Active'
    });
    
    const savedParkingRecord = await newParkingRecord.save();
    
    // Update slot status to occupied
    parkingSlot.slotStatus = 'Occupied';
    await parkingSlot.save();
    
    res.status(201).json(savedParkingRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a parking record (car exit)
exports.updateParkingRecord = async (req, res) => {
  try {
    const { exitTime } = req.body;
    
    const parkingRecord = await ParkingRecord.findById(req.params.id);
    if (!parkingRecord) {
      return res.status(404).json({ message: 'Parking record not found' });
    }
    
    if (parkingRecord.status === 'Completed') {
      return res.status(400).json({ message: 'Parking record is already completed' });
    }
    
    // Set exit time and calculate duration
    parkingRecord.exitTime = exitTime || new Date();
    parkingRecord.status = 'Completed';
    
    // Calculate duration in minutes
    const durationMs = parkingRecord.exitTime - parkingRecord.entryTime;
    parkingRecord.duration = Math.ceil(durationMs / (1000 * 60));
    
    const updatedParkingRecord = await parkingRecord.save();
    
    // Update slot status to available
    await ParkingSlot.findOneAndUpdate(
      { slotNumber: parkingRecord.slotNumber },
      { slotStatus: 'Available' }
    );
    
    res.status(200).json(updatedParkingRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a parking record
exports.deleteParkingRecord = async (req, res) => {
  try {
    const parkingRecord = await ParkingRecord.findById(req.params.id);
    if (!parkingRecord) {
      return res.status(404).json({ message: 'Parking record not found' });
    }
    
    // If the record is active, update the slot status to available
    if (parkingRecord.status === 'Active') {
      await ParkingSlot.findOneAndUpdate(
        { slotNumber: parkingRecord.slotNumber },
        { slotStatus: 'Available' }
      );
    }
    
    await ParkingRecord.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Parking record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
