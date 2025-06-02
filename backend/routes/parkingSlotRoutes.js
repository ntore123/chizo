const express = require('express');
const router = express.Router();
const parkingSlotController = require('../controllers/parkingSlotController');

// GET all parking slots
router.get('/', parkingSlotController.getAllParkingSlots);

// GET a single parking slot
router.get('/:slotNumber', parkingSlotController.getParkingSlot);

// POST a new parking slot
router.post('/', parkingSlotController.createParkingSlot);

// PUT update a parking slot
router.put('/:slotNumber', parkingSlotController.updateParkingSlot);

// DELETE a parking slot
router.delete('/:slotNumber', parkingSlotController.deleteParkingSlot);

module.exports = router;
