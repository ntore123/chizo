const ParkingSlot = require('../models/ParkingSlot');

// Get all parking slots
exports.getAllParkingSlots = async (req, res) => {
  try {
    const parkingSlots = await ParkingSlot.find().sort({ slotNumber: 1 });
    res.status(200).json(parkingSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single parking slot
exports.getParkingSlot = async (req, res) => {
  try {
    const parkingSlot = await ParkingSlot.findOne({ slotNumber: req.params.slotNumber });
    if (!parkingSlot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }
    res.status(200).json(parkingSlot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new parking slot
exports.createParkingSlot = async (req, res) => {
  try {
    const { slotNumber } = req.body;
    
    // Check if slot already exists
    const existingSlot = await ParkingSlot.findOne({ slotNumber });
    if (existingSlot) {
      return res.status(400).json({ message: 'Parking slot already exists' });
    }
    
    const newParkingSlot = new ParkingSlot({
      slotNumber,
      slotStatus: 'Available'
    });
    
    const savedParkingSlot = await newParkingSlot.save();
    res.status(201).json(savedParkingSlot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a parking slot
exports.updateParkingSlot = async (req, res) => {
  try {
    const { slotStatus } = req.body;
    
    const updatedParkingSlot = await ParkingSlot.findOneAndUpdate(
      { slotNumber: req.params.slotNumber },
      { slotStatus },
      { new: true, runValidators: true }
    );
    
    if (!updatedParkingSlot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }
    
    res.status(200).json(updatedParkingSlot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a parking slot
exports.deleteParkingSlot = async (req, res) => {
  try {
    const deletedParkingSlot = await ParkingSlot.findOneAndDelete({ slotNumber: req.params.slotNumber });
    
    if (!deletedParkingSlot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }
    
    res.status(200).json({ message: 'Parking slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
