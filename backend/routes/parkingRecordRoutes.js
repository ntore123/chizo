const express = require('express');
const router = express.Router();
const parkingRecordController = require('../controllers/parkingRecordController');

// GET all parking records
router.get('/', parkingRecordController.getAllParkingRecords);

// GET a single parking record
router.get('/:id', parkingRecordController.getParkingRecord);

// POST a new parking record (car entry)
router.post('/', parkingRecordController.createParkingRecord);

// PUT update a parking record (car exit)
router.put('/:id', parkingRecordController.updateParkingRecord);

// DELETE a parking record
router.delete('/:id', parkingRecordController.deleteParkingRecord);

module.exports = router;
