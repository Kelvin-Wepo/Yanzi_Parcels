import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import businessAPI from '../../services/businessAPI';

const BulkUploadCSV = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [orderName, setOrderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [preview, setPreview] = useState(null);

  const REQUIRED_COLUMNS = [
    'customer_name',
    'customer_phone',
    'delivery_address',
    'item_name',
    'weight_kg',
    'size'
  ];

  const OPTIONAL_COLUMNS = [
    'customer_email',
    'item_description',
    'special_instructions',
    'delivery_lat',
    'delivery_lng'
  ];

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidationError(null);

    // Preview CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Check for required columns
      const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
      if (missing.length > 0) {
        setValidationError(`Missing required columns: ${missing.join(', ')}`);
        return;
      }

      // Show preview
      const previewData = lines.slice(1, 4).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, idx) => {
          obj[header] = values[idx]?.trim() || '';
          return obj;
        }, {});
      });

      setPreview({
        headers,
        rows: previewData,
        totalRows: Math.max(0, lines.length - 1)
      });
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!orderName.trim()) {
      setError('Please enter an order name');
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('csv_file', file);
      formData.append('order_name', orderName);

      const response = await businessAPI.uploadCSV(formData);

      setSuccess({
        message: `Successfully created bulk order with ${response.data.items_created} items`,
        orderId: response.data.bulk_order.id,
        estimatedCost: response.data.estimated_total_cost
      });

      // Reset form
      setFile(null);
      setOrderName('');
      setPreview(null);

      if (onUploadSuccess) {
        onUploadSuccess(response.data.bulk_order);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">CSV Upload Guide</h3>
        <p className="text-sm text-blue-700 mb-3">Required columns:</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
          {REQUIRED_COLUMNS.map(col => (
            <div key={col} className="flex items-center">
              <span className="text-red-500 mr-1">*</span>
              <code className="bg-white px-2 py-1 rounded">{col}</code>
            </div>
          ))}
        </div>
        <p className="text-sm text-blue-700 mt-3 mb-2">Optional columns:</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
          {OPTIONAL_COLUMNS.map(col => (
            <code key={col} className="bg-white px-2 py-1 rounded">{col}</code>
          ))}
        </div>
      </div>

      {/* Order Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Order Name
        </label>
        <input
          type="text"
          value={orderName}
          onChange={(e) => setOrderName(e.target.value)}
          placeholder="e.g., Morning Deliveries"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload CSV File
        </label>
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-700 font-medium">
            {file ? file.name : 'Drop your CSV file here or click to upload'}
          </p>
          <p className="text-gray-500 text-sm mt-1">Supports CSV and XLSX formats</p>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-900">Validation Error</p>
            <p className="text-red-700 text-sm mt-1">{validationError}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && !validationError && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-900">Preview ({preview.totalRows} rows)</h4>
            <span className="text-sm text-gray-600">First 3 rows shown</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  {preview.headers.map(header => (
                    <th key={header} className="px-3 py-2 text-left font-semibold text-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    {preview.headers.map(header => (
                      <td key={`${idx}-${header}`} className="px-3 py-2 text-gray-700">
                        {row[header] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-green-900">{success.message}</p>
            <p className="text-green-700 text-sm mt-1">
              Estimated Total: KES {success.estimatedCost?.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !file || !orderName}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
          uploading || !file || !orderName
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {uploading ? 'Uploading...' : 'Upload & Process'}
      </button>
    </div>
  );
};

export default BulkUploadCSV;
