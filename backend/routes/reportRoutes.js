const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// GET payments report by date
router.get('/payments-by-date', reportController.getPaymentsReportByDate);

module.exports = router;
