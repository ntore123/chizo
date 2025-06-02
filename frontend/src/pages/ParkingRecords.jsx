import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { parkingRecordAPI, parkingSlotAPI, carAPI } from '../services/api';

const ParkingRecords = () => {
  const [parkingRecords, setParkingRecords] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'
  const [formData, setFormData] = useState({
    slotNumber: '',
    plateNumber: '',
    driverName: '',
    phoneNumber: '',
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch parking records
      const recordsResponse = await parkingRecordAPI.getAll();
      setParkingRecords(recordsResponse.data);

      // Fetch available slots
      const slotsResponse = await parkingSlotAPI.getAll();
      setAvailableSlots(slotsResponse.data.filter(slot => slot.slotStatus === 'Available'));

      // Fetch cars
      const carsResponse = await carAPI.getAll();
      setCars(carsResponse.data);
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

    // If selecting an existing car, populate driver info
    if (name === 'plateNumber' && value) {
      const selectedCar = cars.find(car => car.plateNumber === value);
      if (selectedCar) {
        setFormData(prev => ({
          ...prev,
          driverName: selectedCar.driverName,
          phoneNumber: selectedCar.phoneNumber
        }));
      }
    }
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await parkingRecordAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.slotNumber) {
      errors.slotNumber = 'Parking slot is required';
    }

    if (!formData.plateNumber) {
      errors.plateNumber = 'Plate number is required';
    }

    if (!formData.driverName) {
      errors.driverName = 'Driver name is required';
    }

    if (!formData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be 10 digits';
    }

    if (!formData.entryTime) {
      errors.entryTime = 'Entry time is required';
    }

    if (isEditing && formData.status === 'Completed' && !formData.exitTime) {
      errors.exitTime = 'Exit time is required for completed records';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isEditing) {
        // For editing, we need to handle car data separately
        // First, check if car exists and update if needed
        if (formData.plateNumber) {
          try {
            const carResponse = await carAPI.getOne(formData.plateNumber);
            if (carResponse.data) {
              // Update car if it exists
              if (formData.driverName !== carResponse.data.driverName ||
                  formData.phoneNumber !== carResponse.data.phoneNumber) {
                await carAPI.update(formData.plateNumber, {
                  driverName: formData.driverName,
                  phoneNumber: formData.phoneNumber
                });
              }
            } else {
              // Create car if it doesn't exist
              await carAPI.create({
                plateNumber: formData.plateNumber,
                driverName: formData.driverName,
                phoneNumber: formData.phoneNumber
              });
            }
          } catch (error) {
            // Car doesn't exist, create it
            if (error.response && error.response.status === 404) {
              await carAPI.create({
                plateNumber: formData.plateNumber,
                driverName: formData.driverName,
                phoneNumber: formData.phoneNumber
              });
            }
          }
        }

        // Update parking record
        await parkingRecordAPI.update(selectedRecord._id, {
          exitTime: formData.exitTime || null,
          status: formData.status
        });

        // If status changed to Completed, update slot status
        if (formData.status === 'Completed' && selectedRecord.status !== 'Completed') {
          await parkingSlotAPI.update(formData.slotNumber, { slotStatus: 'Available' });
        }
      } else {
        // For creating, we need to handle car data first
        // Check if car exists
        try {
          const carResponse = await carAPI.getOne(formData.plateNumber);
          if (carResponse.data) {
            // Update car if it exists
            if (formData.driverName !== carResponse.data.driverName ||
                formData.phoneNumber !== carResponse.data.phoneNumber) {
              await carAPI.update(formData.plateNumber, {
                driverName: formData.driverName,
                phoneNumber: formData.phoneNumber
              });
            }
          } else {
            // Create car if it doesn't exist
            await carAPI.create({
              plateNumber: formData.plateNumber,
              driverName: formData.driverName,
              phoneNumber: formData.phoneNumber
            });
          }
        } catch (error) {
          // Car doesn't exist, create it
          if (error.response && error.response.status === 404) {
            await carAPI.create({
              plateNumber: formData.plateNumber,
              driverName: formData.driverName,
              phoneNumber: formData.phoneNumber
            });
          } else {
            throw error;
          }
        }

        // Create parking record
        await parkingRecordAPI.create({
          slotNumber: formData.slotNumber,
          plateNumber: formData.plateNumber,
          entryTime: formData.entryTime
        });

        // Update slot status to Occupied
        await parkingSlotAPI.update(formData.slotNumber, { slotStatus: 'Occupied' });
      }

      fetchData();
      closeFormModal();
    } catch (error) {
      console.error('Error saving parking record:', error);
      if (error.response && error.response.data) {
        setFormErrors({ submit: error.response.data.message });
      } else {
        setFormErrors({ submit: 'An error occurred while saving the parking record' });
      }
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedRecord(null);
    setFormData({
      slotNumber: '',
      plateNumber: '',
      driverName: '',
      phoneNumber: '',
      entryTime: new Date().toISOString().slice(0, 16),
      exitTime: '',
      status: 'Active'
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = async (record) => {
    setIsEditing(true);
    setSelectedRecord(record);

    try {
      // Get car details if available
      let driverName = '';
      let phoneNumber = '';

      if (record.plateNumber) {
        const carResponse = await carAPI.getOne(record.plateNumber);
        if (carResponse.data) {
          driverName = carResponse.data.driverName;
          phoneNumber = carResponse.data.phoneNumber;
        }
      }

      setFormData({
        slotNumber: record.slotNumber,
        plateNumber: record.plateNumber,
        driverName,
        phoneNumber,
        entryTime: new Date(record.entryTime).toISOString().slice(0, 16),
        exitTime: record.exitTime ? new Date(record.exitTime).toISOString().slice(0, 16) : '',
        status: record.status
      });
      setFormErrors({});
      setIsFormModalOpen(true);
    } catch (error) {
      console.error('Error fetching car details:', error);
      setFormData({
        slotNumber: record.slotNumber,
        plateNumber: record.plateNumber,
        driverName: '',
        phoneNumber: '',
        entryTime: new Date(record.entryTime).toISOString().slice(0, 16),
        exitTime: record.exitTime ? new Date(record.exitTime).toISOString().slice(0, 16) : '',
        status: record.status
      });
      setFormErrors({});
      setIsFormModalOpen(true);
    }
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} min${mins !== 1 ? 's' : ''}`;
    }

    return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
  };

  const filteredRecords = parkingRecords.filter(record => {
    if (filter === 'all') return true;
    return record.status.toLowerCase() === filter;
  });

  const columns = [
    { header: 'Slot Number', accessor: 'slotNumber' },
    { header: 'Plate Number', accessor: 'plateNumber' },
    {
      header: 'Entry Time',
      accessor: 'entryTime',
      cell: (row) => formatDateTime(row.entryTime)
    },
    {
      header: 'Exit Time',
      accessor: 'exitTime',
      cell: (row) => formatDateTime(row.exitTime)
    },
    {
      header: 'Duration',
      accessor: 'duration',
      cell: (row) => formatDuration(row.duration)
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {row.status}
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
            onClick={() => handleViewRecord(row)}
          >
            View
          </Button>
          <Button
            variant="primary"
            className="py-1 px-2 text-sm"
            onClick={() => openEditModal(row)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            className="py-1 px-2 text-sm"
            onClick={() => handleDeleteRecord(row._id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Parking Records</h2>
        <div className="flex space-x-2">
          <Button
            variant="primary"
            onClick={openCreateModal}
            className="mr-4"
          >
            Add New Record
          </Button>
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'secondary'}
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'completed' ? 'primary' : 'secondary'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-4">Loading parking records...</div>
        ) : (
          <Table columns={columns} data={filteredRecords} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Parking Record Details"
        size="sm"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Slot Number</p>
                <p className="font-medium">{selectedRecord.slotNumber}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Plate Number</p>
                <p className="font-medium">{selectedRecord.plateNumber}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Entry Time</p>
                <p className="font-medium">{formatDateTime(selectedRecord.entryTime)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Exit Time</p>
                <p className="font-medium">{formatDateTime(selectedRecord.exitTime)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{formatDuration(selectedRecord.duration)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`font-medium ${
                  selectedRecord.status === 'Active' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {selectedRecord.status}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium">{formatDateTime(selectedRecord.createdAt)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Updated At</p>
                <p className="font-medium">{formatDateTime(selectedRecord.updatedAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal for adding/editing parking records */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={isEditing ? 'Edit Parking Record' : 'Add New Parking Record'}
        size="sm"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={closeFormModal} type="button">
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
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parking Slot <span className="text-red-500">*</span>
                </label>
                <select
                  name="slotNumber"
                  value={formData.slotNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.slotNumber ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                >
                  <option value="">Select a parking slot</option>
                  {availableSlots.map(slot => (
                    <option key={slot.slotNumber} value={slot.slotNumber}>
                      {slot.slotNumber}
                    </option>
                  ))}
                </select>
                {formErrors.slotNumber && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.slotNumber}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <select
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      formErrors.plateNumber ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                  >
                    <option value="">Select a car or enter new</option>
                    {cars.map(car => (
                      <option key={car.plateNumber} value={car.plateNumber}>
                        {car.plateNumber} - {car.driverName}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.plateNumber && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.plateNumber}</p>
                )}
              </div>

              <Input
                label="Driver Name"
                id="driverName"
                name="driverName"
                value={formData.driverName}
                onChange={handleInputChange}
                placeholder="Enter driver name"
                required
                error={formErrors.driverName}
              />

              <Input
                label="Phone Number"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter phone number (10 digits)"
                required
                error={formErrors.phoneNumber}
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="entryTime"
                  value={formData.entryTime}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.entryTime ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
                {formErrors.entryTime && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.entryTime}</p>
                )}
              </div>
            </>
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
                  Plate Number
                </label>
                <p className="text-gray-900 font-medium">{formData.plateNumber}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Time
                </label>
                <p className="text-gray-900 font-medium">{formatDateTime(formData.entryTime)}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {formData.status === 'Completed' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exit Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="exitTime"
                    value={formData.exitTime}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${
                      formErrors.exitTime ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500`}
                  />
                  {formErrors.exitTime && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.exitTime}</p>
                  )}
                </div>
              )}
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

export default ParkingRecords;
