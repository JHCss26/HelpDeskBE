import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import { saveAs } from 'file-saver';

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tickets/export', {
        responseType: 'blob'
      });
      // Infer filename from headers or use default
      const filename = 'tickets.xlsx';
      saveAs(res.data, filename);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to download tickets.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
    >
      {loading ? 'Preparing…' : 'Export to Excel'}
    </button>
  );
}
