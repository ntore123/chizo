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
    
    // Check if car already exists
    const existingCar = await Car.findOne({ plateNumber });
    if (existingCar) {
      return res.status(400).json({ message: 'Car already exists' });
    }
    
    const newCar = new Car({
      plateNumber,
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
