import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { parkingRecordAPI, paymentAPI } from '../services/api';

const CarExit = () => {
  const [activeRecords, setActiveRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [fee, setFee] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchActiveRecords();
  }, []);

  const fetchActiveRecords = async () => {
    try {
      setLoading(true);
      const response = await parkingRecordAPI.getAll();
      const records = response.data.filter(record => record.status === 'Active');
      setActiveRecords(records);
    } catch (error) {
      console.error('Error fetching active records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordExit = async (record) => {
    setSelectedRecord(record);
    
    try {
      // Calculate fee
      const feeResponse = await paymentAPI.calculateFee(record._id);
      setFee(feeResponse.data);
      
      // Open modal
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error calculating fee:', error);
    }
  };

  const handleConfirmExit = async () => {
    try {
      // Update parking record with exit time
      await parkingRecordAPI.update(selectedRecord._id, {
        exitTime: new Date()
      });
      
      // Create payment record
      await paymentAPI.create({
        parkingRecordId: selectedRecord._id,
        amountPaid: fee.fee
      });
      
      // Show success message
      setSuccessMessage(`Car with plate number ${selectedRecord.plateNumber} has exited successfully. Fee: ${fee.fee} RWF`);
      
      // Close modal
      setIsModalOpen(false);
      
      // Refresh active records
      fetchActiveRecords();
    } catch (error) {
      console.error('Error processing car exit:', error);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const columns = [
    { header: 'Slot Number', accessor: 'slotNumber' },
    { header: 'Plate Number', accessor: 'plateNumber' },
    { 
      header: 'Entry Time', 
      accessor: 'entryTime',
      cell: (row) => formatDateTime(row.entryTime)
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button 
          variant="primary" 
          className="py-1 px-2 text-sm"
          onClick={() => handleRecordExit(row)}
        >
          Record Exit
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Car Exit</h2>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {successMessage}
        </div>
      )}
      
      <Card>
        {loading ? (
          <div className="text-center py-4">Loading active parking records...</div>
        ) : (
          <>
            {activeRecords.length === 0 ? (
              <div className="text-center py-4">No active parking records found</div>
            ) : (
              <Table columns={columns} data={activeRecords} />
            )}
          </>
        )}
      </Card>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Car Exit"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmExit}>
              Confirm Exit
            </Button>
          </div>
        }
      >
        {selectedRecord && fee && (
          <div className="space-y-4">
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
              <p className="font-medium">{formatDateTime(new Date())}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">{fee.duration} minutes ({fee.hours} hour(s))</p>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-lg font-semibold">Parking Fee</p>
              <p className="text-2xl font-bold text-amber-600">{fee.fee} RWF</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CarExit;
