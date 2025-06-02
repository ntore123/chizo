import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Parking Slots API
export const parkingSlotAPI = {
  getAll: () => api.get('/parking-slots'),
  getOne: (slotNumber) => api.get(`/parking-slots/${slotNumber}`),
  create: (data) => api.post('/parking-slots', data),
  update: (slotNumber, data) => api.put(`/parking-slots/${slotNumber}`, data),
  delete: (slotNumber) => api.delete(`/parking-slots/${slotNumber}`),
};

// Cars API
export const carAPI = {
  getAll: () => api.get('/cars'),
  getOne: (plateNumber) => api.get(`/cars/${plateNumber}`),
  create: (data) => api.post('/cars', data),
  update: (plateNumber, data) => api.put(`/cars/${plateNumber}`, data),
  delete: (plateNumber) => api.delete(`/cars/${plateNumber}`),
};

// Parking Records API
export const parkingRecordAPI = {
  getAll: () => api.get('/parking-records'),
  getOne: (id) => api.get(`/parking-records/${id}`),
  create: (data) => api.post('/parking-records', data),
  update: (id, data) => api.put(`/parking-records/${id}`, data),
  delete: (id) => api.delete(`/parking-records/${id}`),
};

// Payments API
export const paymentAPI = {
  getAll: () => api.get('/payments'),
  getOne: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  calculateFee: (parkingRecordId) => api.get(`/payments/calculate/${parkingRecordId}`),
  getReportByDate: async (date) => {
    try {
      const response = await api.get(`/reports/payments-by-date?date=${date}`);
      return response;
    } catch (err) {
      if (err.response && err.response.data && err.response.data.stack) {
        throw new Error(`${err.response.data.message}\n${err.response.data.stack}`);
      }
      throw err;
    }
  },
};

export default api;
