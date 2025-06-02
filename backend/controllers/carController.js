const Car = require('../models/Car');

// Get all cars
exports.getAllCars = async (req, res) => {
  try {
    const cars = await Car.find().sort({ plateNumber: 1 });
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single car
exports.getCar = async (req, res) => {
  try {
    const car = await Car.findOne({ plateNumber: req.params.plateNumber });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new car
exports.createCar = async (req, res) => {
  try {
    const { plateNumber, driverName, phoneNumber } = req.body;
    // Plate number: Rwandan format e.g. 'RAB123A' or 'RAD456B'
    const plateRegex = /^RA[BCDEFGHJKLNPQRSTUVWXZ]\d{3}[A-Z]$/i;
    if (!plateRegex.test(plateNumber)) {
      return res.status(400).json({ message: 'Plate number must match the Rwandan format (e.g. RAB123A)' });
    }
    if (!driverName || !/^[A-Za-z\s'-]{2,}$/.test(driverName)) {
      return res.status(400).json({ message: 'Enter a valid driver name (letters, spaces, apostrophes, hyphens)' });
    }
    if (!/^0[7][2389]\d{7}$/.test(phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must be a valid Rwandan number (e.g. 07XXXXXXXX)' });
    }
    // Check if car already exists
    const existingCar = await Car.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existingCar) {
      return res.status(400).json({ message: 'A car with this plate number already exists.' });
    }
    const newCar = new Car({
      plateNumber: plateNumber.toUpperCase(),
      driverName,
      phoneNumber
    });
    const savedCar = await newCar.save();
    res.status(201).json(savedCar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a car
exports.updateCar = async (req, res) => {
  try {
    const { driverName, phoneNumber } = req.body;
    
    const updatedCar = await Car.findOneAndUpdate(
      { plateNumber: req.params.plateNumber },
      { driverName, phoneNumber },
      { new: true, runValidators: true }
    );
    
    if (!updatedCar) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    res.status(200).json(updatedCar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a car
exports.deleteCar = async (req, res) => {
  try {
    const deletedCar = await Car.findOneAndDelete({ plateNumber: req.params.plateNumber });
    
    if (!deletedCar) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    res.status(200).json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
