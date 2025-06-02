import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { parkingSlotAPI, parkingRecordAPI } from '../services/api';

const CarEntry = () => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    slotNumber: '',
    plateNumber: '',
    driverName: '',
    phoneNumber: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchAvailableSlots();
  }, []);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await parkingSlotAPI.getAll();
      const slots = response.data.filter(slot => slot.slotStatus === 'Available');
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
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
    
    if (!formData.slotNumber) {
      errors.slotNumber = 'Please select a parking slot';
    }
    
    if (!formData.plateNumber.trim()) {
      errors.plateNumber = 'Plate number is required';
    }
    
    if (!formData.driverName.trim()) {
      errors.driverName = 'Driver name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    if (!validateForm()) return;
    
    try {
      await parkingRecordAPI.create(formData);
      
      // Show success message
      setSuccessMessage('Car entry recorded successfully!');
      
      // Reset form
      setFormData({
        slotNumber: '',
        plateNumber: '',
        driverName: '',
        phoneNumber: ''
      });
      
      // Refresh available slots
      fetchAvailableSlots();
    } catch (error) {
      console.error('Error recording car entry:', error);
      if (error.response && error.response.data) {
        setFormErrors({ submit: error.response.data.message });
      } else {
        setFormErrors({ submit: 'An error occurred while recording the car entry' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Car Entry</h2>
      
      <Card>
        {loading ? (
          <div className="text-center py-4">Loading available slots...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                {successMessage}
              </div>
            )}
            
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
              {availableSlots.length === 0 && !loading && (
                <p className="mt-1 text-sm text-amber-500">No available parking slots</p>
              )}
            </div>
            
            <Input
              label="Plate Number"
              id="plateNumber"
              name="plateNumber"
              value={formData.plateNumber}
              onChange={handleInputChange}
              placeholder="Enter plate number"
              required
              error={formErrors.plateNumber}
            />
            
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
              placeholder="Enter phone number"
              required
              error={formErrors.phoneNumber}
            />
            
            {formErrors.submit && (
              <p className="mt-2 text-sm text-red-600">{formErrors.submit}</p>
            )}
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={availableSlots.length === 0}
              >
                Record Entry
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default CarEntry;
