import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { paymentAPI, parkingRecordAPI } from '../services/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [completedRecords, setCompletedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [parkingRecord, setParkingRecord] = useState(null);
  const [formData, setFormData] = useState({
    parkingRecordId: '',
    amountPaid: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch payments
      const paymentsResponse = await paymentAPI.getAll();
      setPayments(paymentsResponse.data);

      // Fetch completed parking records that don't have payments
      const recordsResponse = await parkingRecordAPI.getAll();

      // Get all completed records
      const completedRecords = recordsResponse.data.filter(record =>
        record.status === 'Completed'
      );

      // Filter out records that already have payments
      const unpaidRecords = completedRecords.filter(record =>
        !paymentsResponse.data.some(payment =>
          payment.parkingRecordId === record._id
        )
      );

      setCompletedRecords(unpaidRecords);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }

    // If selecting a parking record, calculate and set the fee
    if (name === 'parkingRecordId' && value) {
      calculateFee(value);
    }
  };

  const calculateFee = async (parkingRecordId) => {
    try {
      // Get the record details to display
      const recordResponse = await parkingRecordAPI.getOne(parkingRecordId);
      const record = recordResponse.data;

      // Calculate the fee
      const feeResponse = await paymentAPI.calculateFee(parkingRecordId);
      const fee = feeResponse.data.fee;

      // Update form data with the calculated fee
      setFormData(prev => ({ ...prev, amountPaid: fee }));

      // Show a message with the calculation details
      console.log(`Fee calculated for ${record.plateNumber}: ${fee} RWF (${feeResponse.data.hours} hours)`);
    } catch (error) {
      console.error('Error calculating fee:', error);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.parkingRecordId) {
      errors.parkingRecordId = 'Parking record is required';
    }

    if (!formData.amountPaid) {
      errors.amountPaid = 'Amount is required';
    } else if (isNaN(formData.amountPaid) || parseFloat(formData.amountPaid) <= 0) {
      errors.amountPaid = 'Amount must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await paymentAPI.create({
        parkingRecordId: formData.parkingRecordId,
        amountPaid: parseFloat(formData.amountPaid)
      });

      fetchData();
      closeCreateModal();
    } catch (error) {
      console.error('Error creating payment:', error);
      if (error.response && error.response.data) {
        setFormErrors({ submit: error.response.data.message });
      } else {
        setFormErrors({ submit: 'An error occurred while creating the payment' });
      }
    }
  };

  const handleViewPayment = async (payment) => {
    setSelectedPayment(payment);

    try {
      // Fetch associated parking record
      const recordResponse = await parkingRecordAPI.getOne(payment.parkingRecordId);
      setParkingRecord(recordResponse.data);

      // Open modal
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching parking record:', error);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} RWF`;
  };

  const viewPaymentDetails = (payment) => {
    // Just view payment details, no invoice generation
    handleViewPayment(payment);
  };

  const openCreateModal = () => {
    setFormData({
      parkingRecordId: '',
      amountPaid: ''
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const columns = [
    {
      header: 'Payment ID',
      accessor: '_id',
      cell: (row) => row._id.substring(0, 8) + '...'
    },
    {
      header: 'Amount',
      accessor: 'amountPaid',
      cell: (row) => formatCurrency(row.amountPaid)
    },
    {
      header: 'Payment Date',
      accessor: 'paymentDate',
      cell: (row) => formatDateTime(row.paymentDate)
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            className="py-1 px-2 text-sm"
            onClick={() => handleViewPayment(row)}
          >
            View
          </Button>

        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Payments</h2>
        <Button onClick={openCreateModal}>Add New Payment</Button>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-4">Loading payments...</div>
        ) : (
          <Table columns={columns} data={payments} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Payment Details"
        size="sm"
      >
        {selectedPayment && parkingRecord && (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-4">SmartPark Invoice</h3>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Invoice #</p>
                  <p className="font-medium">{selectedPayment._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDateTime(selectedPayment.paymentDate)}</p>
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-medium mb-2">Parking Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Slot Number</p>
                  <p className="font-medium">{parkingRecord.slotNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plate Number</p>
                  <p className="font-medium">{parkingRecord.plateNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entry Time</p>
                  <p className="font-medium">{formatDateTime(parkingRecord.entryTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Exit Time</p>
                  <p className="font-medium">{formatDateTime(parkingRecord.exitTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{parkingRecord.duration} minutes</p>
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-medium mb-2">Payment Summary</h4>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Hourly Rate</p>
                  <p className="font-medium">500 RWF</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hours</p>
                  <p className="font-medium">{Math.ceil(parkingRecord.duration / 60)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-bold text-xl text-amber-600">{formatCurrency(selectedPayment.amountPaid)}</p>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>Thank you for using SmartPark!</p>
              <p>For any inquiries, please contact us at support@smartpark.rw</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal for creating new payment */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create New Payment"
        size="sm"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={closeCreateModal} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              type="button"
            >
              Save
            </Button>
          </div>
        }
      >
        <div id="modal-form">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parking Record <span className="text-red-500">*</span>
            </label>
            <select
              name="parkingRecordId"
              value={formData.parkingRecordId}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${
                formErrors.parkingRecordId ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
            >
              <option value="">Select a parking record</option>
              {completedRecords.length === 0 ? (
                <option value="" disabled>No unpaid completed records available</option>
              ) : (
                completedRecords.map(record => (
                  <option key={record._id} value={record._id}>
                    Plate: {record.plateNumber} | Slot: {record.slotNumber} | Exit: {new Date(record.exitTime).toLocaleString()}
                  </option>
                ))
              )}
            </select>
            {formErrors.parkingRecordId && (
              <p className="mt-1 text-sm text-red-500">{formErrors.parkingRecordId}</p>
            )}
          </div>

          <Input
            label="Amount (RWF)"
            id="amountPaid"
            name="amountPaid"
            value={formData.amountPaid}
            onChange={handleInputChange}
            placeholder="Enter amount"
            required
            error={formErrors.amountPaid}
          />

          {formErrors.submit && (
            <p className="mt-2 text-sm text-red-600">{formErrors.submit}</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Payments;
