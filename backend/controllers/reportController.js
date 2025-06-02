const Payment = require('../models/Payment');
const Car = require('../models/Car');

// Get payments report by date (robust, debuggable)
exports.getPaymentsReportByDate = async (req, res) => {
  try {
    const { date } = req.query;
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
