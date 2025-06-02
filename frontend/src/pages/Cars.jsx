import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { carAPI } from '../services/api';

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    plateNumber: '',
    driverName: '',
    phoneNumber: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const response = await carAPI.getAll();
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Plate Number', accessor: 'plateNumber' },
    { header: 'Driver Name', accessor: 'driverName' },
    { header: 'Phone Number', accessor: 'phoneNumber' },
    {
      header: 'Registration Date',
      accessor: 'createdAt',
      cell: (row) => new Date(row.createdAt).toLocaleDateString()
    },

  ];

  const handleOpenModal = () => {
    setForm({ plateNumber: '', driverName: '', phoneNumber: '' });
    setFormError('');
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let valid = true;
    let errorMsg = '';
    // Plate number: Rwandan format e.g. 'RAB123A' or 'RAD456B'
    const plateRegex = /^RA[BCDEFGHJKLNPQRSTUVWXZ]\d{3}[A-Z]$/i;
    if (!plateRegex.test(form.plateNumber)) {
      errorMsg = 'Plate number must match the Rwandan format (e.g. RAB123A)';
      valid = false;
    } else if (!form.driverName.trim() || !/^[A-Za-z\s'-]{2,}$/.test(form.driverName)) {
      errorMsg = 'Enter a valid driver name (letters, spaces, apostrophes, hyphens)';
      valid = false;
    } else if (!/^0[7][2389]\d{7}$/.test(form.phoneNumber)) {
      errorMsg = 'Phone number must be a valid Rwandan number (e.g. 07XXXXXXXX)';
      valid = false;
    }
    setFormError(errorMsg);
    return valid;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await carAPI.create(form);
      setIsModalOpen(false);
      fetchCars();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message && error.response.data.message.includes('already exists')) {
        setFormError('A car with this plate number already exists.');
      } else {
        setFormError('Failed to add car.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Cars Management</h2>
        <Button variant="primary" onClick={handleOpenModal}>Add Car</Button>
      </div>
      <Card>
        {loading ? (
          <div className="text-center py-4">Loading cars...</div>
        ) : (
          <Table columns={columns} data={cars} />
        )}
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New Car">
        <form id="modal-form" onSubmit={handleFormSubmit}>
          <Input
            label="Plate Number"
            name="plateNumber"
            value={form.plateNumber}
            onChange={handleFormChange}
            required
          />
          <Input
            label="Driver Name"
            name="driverName"
            value={form.driverName}
            onChange={handleFormChange}
            required
          />
          <Input
            label="Phone Number"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleFormChange}
            required
          />
          {formError && <div className="text-red-500 text-sm mb-2">{formError}</div>}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="secondary" type="button" onClick={handleCloseModal} disabled={submitting}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Cars;
