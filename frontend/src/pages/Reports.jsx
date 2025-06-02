import React, { useState, useRef } from 'react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Card from '../components/ui/Card';
import { paymentAPI } from '../services/api';

const Reports = () => {
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState([]);
  const [error, setError] = useState('');
  const printRef = useRef();

  const columns = [
    { header: 'Payment ID', accessor: '_id' },
    { header: 'Driver Name', accessor: 'driverName' },
    { header: 'Plate Number', accessor: 'plateNumber' },
    { header: 'Amount Paid', accessor: 'amountPaid' },
    { header: 'Payment Date', accessor: 'paymentDate', cell: row => new Date(row.paymentDate).toLocaleString() },
  ];

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setReport([]);
    if (!date) {
      setError('Please select a date.');
      return;
    }
    setLoading(true);
    try {
      const response = await paymentAPI.getReportByDate(date);
      setReport(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=900');
    printWindow.document.write('<html><head><title>Payments Report</title>');
    printWindow.document.write('<style>body{font-family:sans-serif;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;text-align:left;} .signature{margin-top:40px;} .print-title{text-align:center;font-size:1.5em;font-weight:bold;margin-bottom:10px;} .print-meta{margin-bottom:20px;text-align:center;}@media print { button, .no-print { display: none !important; } }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<div class="print-title">Payments Report</div>`);
    printWindow.document.write(`<div class="print-meta">Date: ${date} <br/> Printed by: ___________________________</div>`);
    printWindow.document.write(printContents);
    printWindow.document.write('<div class="signature"><strong>Signature:</strong> ___________________________</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Payments Report by Date</h2>
      <Card>
        <form onSubmit={handleSubmit} className="flex items-end space-x-4 mb-4 no-print">
          <Input
            label="Select Date"
            type="date"
            name="date"
            value={date}
            onChange={handleDateChange}
            required
          />
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </form>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div ref={printRef}>
          {report.length > 0 && (
            <>
              <Table columns={columns} data={report} />
              <div className="mt-4 text-right font-semibold text-lg text-amber-700">
                Total Amount Paid: {report.reduce((sum, row) => sum + (Number(row.amountPaid) || 0), 0)}
              </div>
            </>
          )}
        </div>
        {report.length === 0 && !loading && !error && (
          <div className="text-gray-500">No report data to display.</div>
        )}
      </Card>
    </div>
  );
};

export default Reports;
