import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ParkingSlots from './pages/ParkingSlots';
import ParkingRecords from './pages/ParkingRecords';
import Payments from './pages/Payments';
import Cars from './pages/Cars';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/parking-slots" replace />} />
          <Route path="/parking-slots" element={
            <PrivateRoute>
              <Layout>
                <ParkingSlots />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/cars" element={
            <PrivateRoute>
              <Layout>
                <Cars />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/parking-records" element={
            <PrivateRoute>
              <Layout>
                <ParkingRecords />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/payments" element={
            <PrivateRoute>
              <Layout>
                <Payments />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute>
              <Layout>
                <Reports />
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
