import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { parkingSlotAPI, parkingRecordAPI, paymentAPI } from '../services/api';

const ParkingSlots = () => {
  const [parkingSlots, setParkingSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ slotNumber: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [stats, setStats] = useState({
    totalSlots: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    activeRecords: 0,
    totalRecords: 0,
    totalPayments: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch parking slots
      const slotsResponse = await parkingSlotAPI.getAll();
      setParkingSlots(slotsResponse.data);

      // Fetch parking records
      const recordsResponse = await parkingRecordAPI.getAll();
      const records = recordsResponse.data;

      // Fetch payments
      const paymentsResponse = await paymentAPI.getAll();
      const payments = paymentsResponse.data;

      // Calculate stats
      const totalSlots = slotsResponse.data.length;
      const availableSlots = slotsResponse.data.filter(slot => slot.slotStatus === 'Available').length;
      const occupiedSlots = totalSlots - availableSlots;
      const activeRecords = records.filter(record => record.status === 'Active').length;

      setStats({
        totalSlots,
        availableSlots,
        occupiedSlots,
        activeRecords,
        totalRecords: records.length,
        totalPayments: payments.length,
      });
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
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.slotNumber?.trim()) {
      errors.slotNumber = 'Slot number is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditing) {
        await parkingSlotAPI.update(selectedSlot.slotNumber, { slotStatus: formData.slotStatus });
      } else {
        await parkingSlotAPI.create({ slotNumber: formData.slotNumber });
      }

      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving parking slot:', error);
      if (error.response && error.response.data) {
        setFormErrors({ submit: error.response.data.message });
      } else {
        setFormErrors({ submit: 'An error occurred while saving the parking slot' });
      }
    }
  };

  const handleDelete = async (slotNumber) => {
    if (window.confirm('Are you sure you want to delete this parking slot?')) {
      try {
        await parkingSlotAPI.delete(slotNumber);
        fetchData();
      } catch (error) {
        console.error('Error deleting parking slot:', error);
      }
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedSlot(null);
    setFormData({ slotNumber: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (slot) => {
    setIsEditing(true);
    setSelectedSlot(slot);
    setFormData({
      slotNumber: slot.slotNumber,
      slotStatus: slot.slotStatus
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const columns = [
    { header: 'Slot Number', accessor: 'slotNumber' },
    {
      header: 'Status',
      accessor: 'slotStatus',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.slotStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {row.slotStatus}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            className="py-1 px-2 text-sm"
            onClick={() => openEditModal(row)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            className="py-1 px-2 text-sm"
            onClick={() => handleDelete(row.slotNumber)}
            disabled={row.slotStatus === 'Occupied'}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  // Stat card component
  const StatCard = ({ title, value, color }) => (
    <Card className="flex flex-col items-center justify-center p-6">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Parking Slots Management</h2>
        <Button onClick={openCreateModal}>Add New Slot</Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Slots"
          value={stats.totalSlots}
          color="text-blue-600"
        />
        <StatCard
          title="Available Slots"
          value={stats.availableSlots}
          color="text-green-600"
        />
        <StatCard
          title="Occupied Slots"
          value={stats.occupiedSlots}
          color="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Parking Records"
          value={stats.activeRecords}
          color="text-purple-600"
        />
        <StatCard
          title="Total Records"
          value={stats.totalRecords}
          color="text-indigo-600"
        />
        <StatCard
          title="Total Payments"
          value={stats.totalPayments}
          color="text-red-600"
        />
      </div>

      {/* Parking Slots Table */}
      <Card title="Parking Slots">
        {loading ? (
          <div className="text-center py-4">Loading parking slots...</div>
        ) : (
          <Table columns={columns} data={parkingSlots} />
        )}
      </Card>

      {/* Modal for adding/editing parking slots */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? 'Edit Parking Slot' : 'Add New Parking Slot'}
        size="sm"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={closeModal} type="button">
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
          {!isEditing ? (
            <Input
              label="Slot Number"
              id="slotNumber"
              name="slotNumber"
              value={formData.slotNumber}
              onChange={handleInputChange}
              placeholder="Enter slot number"
              required
              error={formErrors.slotNumber}
            />
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slot Number
                </label>
                <p className="text-gray-900 font-medium">{formData.slotNumber}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    name="slotStatus"
                    value={formData.slotStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {formErrors.submit && (
            <p className="mt-2 text-sm text-red-600">{formErrors.submit}</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ParkingSlots;
