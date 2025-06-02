const Payment = require('../models/Payment');
const ParkingRecord = require('../models/ParkingRecord');
const Car = require('../models/Car');

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ paymentDate: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single payment
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const { parkingRecordId, amountPaid } = req.body;
    
    // Check if parking record exists and is completed
    const parkingRecord = await ParkingRecord.findById(parkingRecordId);
    if (!parkingRecord) {
      return res.status(404).json({ message: 'Parking record not found' });
    }
    
    if (parkingRecord.status !== 'Completed') {
      return res.status(400).json({ message: 'Cannot create payment for active parking record' });
    }
    
    // Check if payment already exists for this record
    const existingPayment = await Payment.findOne({ parkingRecordId });
    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already exists for this parking record' });
    }
    
    const newPayment = new Payment({
      parkingRecordId,
      amountPaid,
      paymentDate: new Date()
    });
    
    const savedPayment = await newPayment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate parking fee
exports.calculateFee = async (req, res) => {
  try {
    const { parkingRecordId } = req.params;
    
    const parkingRecord = await ParkingRecord.findById(parkingRecordId);
    if (!parkingRecord) {
      return res.status(404).json({ message: 'Parking record not found' });
    }
    
    if (parkingRecord.status !== 'Completed') {
      return res.status(400).json({ message: 'Cannot calculate fee for active parking record' });
    }
    
    // Calculate fee based on duration (in minutes)
    // Base rate: 500 RWF per hour, minimum 1 hour
    const hourlyRate = 500;
    const hours = Math.ceil(parkingRecord.duration / 60);
    const fee = hours * hourlyRate;
    
    res.status(200).json({ 
      parkingRecordId,
      duration: parkingRecord.duration,
      hours,
      fee
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payments by date with driver info
exports.getPaymentsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    // Parse date and get range for the day
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Find payments for the date, populate parkingRecordId
    const payments = await Payment.find({
      paymentDate: { $gte: start, $lte: end }
    }).populate({
      path: 'parkingRecordId',
      populate: { path: 'plateNumber', model: 'Car' }
    });

    // Map to include driver info
    const result = await Promise.all(payments.map(async (payment) => {
      let driverName = '';
      let plateNumber = '';
      if (payment.parkingRecordId) {
        plateNumber = payment.parkingRecordId.plateNumber;
        // Find car by plateNumber
        const car = await require('../models/Car').findOne({ plateNumber });
        if (car) driverName = car.driverName;
      }
      return {
        _id: payment._id,
        driverName,
        plateNumber,
        amountPaid: payment.amountPaid,
        paymentDate: payment.paymentDate
      };
    }));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payments report by date (renovated, robust, and debuggable)
exports.getPaymentsReportByDate = async (req, res) => {
  try {
    const { date } = req.query;
    console.log(date);
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    // Get start and end of the day
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Find all payments for the date
    const payments = await Payment.find({
      paymentDate: { $gte: start, $lte: end }
    }).populate('parkingRecordId');

    // Defensive: If no payments, return empty array
    if (!payments || payments.length === 0) {
      return res.status(200).json([]);
    }

    // For each payment, fetch the car info using the plateNumber from the parking record
    const report = await Promise.all(payments.map(async payment => {
      let driverName = '';
      let plateNumber = '';
      try {
        if (payment.parkingRecordId && payment.parkingRecordId.plateNumber) {
          plateNumber = payment.parkingRecordId.plateNumber;
          // Ensure plateNumber is uppercase for Car lookup
          const car = await Car.findOne({ plateNumber: plateNumber.toUpperCase() });
          if (car) driverName = car.driverName;
        }
      } catch (err) {
        console.error('Error fetching car for payment', payment._id, err);
      }
      return {
        _id: payment._id,
        driverName,
        plateNumber,
        amountPaid: payment.amountPaid,
        paymentDate: payment.paymentDate
      };
    }));
    res.status(200).json(report);
  } catch (error) {
    console.error('Error in getPaymentsReportByDate:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};
