/*!
 * 3D File Upload Component
 * @author @aduy0 <aduy050302@gmail.com>
 * @created 2025-06-10
 * @description: React component for 3D file upload with print customization
 */

import React, { useState, useRef } from 'react';
import './FileUpload.css';

const FileUpload = () => {
  // [@aduy0] - Component state management
  const [uploadState, setUploadState] = useState({
    file: null,
    uploading: false,
    uploaded: false,
    fileInfo: null,
    printOptions: {
      material: 'PLA',
      quality: 'Standard',
      infill: 20,
      walls: 3,
      supports: 'Auto'
    },
    estimatedPrice: null,
    customerEmail: ''
  });

  const fileInputRef = useRef(null);

  // [@aduy0] - File selection handler
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadState(prev => ({
        ...prev,
        file: file,
        uploaded: false,
        fileInfo: null
      }));
    }
  };

  // [@aduy0] - Drag and drop handlers
  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      setUploadState(prev => ({
        ...prev,
        file: files[0],
        uploaded: false,
        fileInfo: null
      }));
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // [@aduy0] - File upload function
  const uploadFile = async () => {
    if (!uploadState.file || !uploadState.customerEmail) {
      alert('Please select a file and enter your email');
      return;
    }

    setUploadState(prev => ({ ...prev, uploading: true }));

    const formData = new FormData();
    formData.append('3dFile', uploadState.file);
    formData.append('customerEmail', uploadState.customerEmail);
    formData.append('fileName', uploadState.file.name);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          uploading: false,
          uploaded: true,
          fileInfo: result.fileInfo,
          printOptions: result.printingOptions,
          estimatedPrice: result.estimatedPrice
        }));
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
      setUploadState(prev => ({ ...prev, uploading: false }));
    }
  };

  // [@aduy0] - Print option change handler
  const handlePrintOptionChange = (option, value) => {
    setUploadState(prev => ({
      ...prev,
      printOptions: {
        ...prev.printOptions,
        [option]: value
      }
    }));
    
    // Recalculate price based on options
    recalculatePrice();
  };

  // [@aduy0] - Price recalculation (basic)
  const recalculatePrice = () => {
    if (!uploadState.estimatedPrice) return;
    
    const basePrice = parseFloat(uploadState.estimatedPrice.base);
    let multiplier = 1;
    
    // Material multipliers
    const materialMultipliers = {
      'PLA': 1,
      'ABS': 1.2,
      'PETG': 1.3,
      'TPU': 2.0
    };
    
    // Quality multipliers
    const qualityMultipliers = {
      'Draft': 0.8,
      'Standard': 1,
      'High': 1.4,
      'Ultra': 2.0
    };
    
    multiplier *= materialMultipliers[uploadState.printOptions.material] || 1;
    multiplier *= qualityMultipliers[uploadState.printOptions.quality] || 1;
    multiplier *= (uploadState.printOptions.infill / 20); // Base infill is 20%
    
    const newPrice = (basePrice * multiplier).toFixed(2);
    
    setUploadState(prev => ({
      ...prev,
      estimatedPrice: {
        ...prev.estimatedPrice,
        base: newPrice
      }
    }));
  };

  return (
    <div className="file-upload-container">
      <div className="upload-header">
        <h2>🎯 Custom 3D Printing Order</h2>
        <p>Upload your 3D file and customize your print settings</p>
      </div>

      {/* [@aduy0] - Customer email input */}
      {!uploadState.uploaded && (
        <div className="customer-info">
          <label htmlFor="customerEmail">Your Email Address:</label>
          <input
            type="email"
            id="customerEmail"
            value={uploadState.customerEmail}
            onChange={(e) => setUploadState(prev => ({ ...prev, customerEmail: e.target.value }))}
            placeholder="customer@example.com"
            required
          />
        </div>
      )}

      {/* [@aduy0] - File upload area */}
      {!uploadState.uploaded && (
        <div 
          className="upload-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-content">
            {uploadState.file ? (
              <div className="file-selected">
                <span className="file-icon">📁</span>
                <p><strong>Selected:</strong> {uploadState.file.name}</p>
                <p><strong>Size:</strong> {(uploadState.file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="upload-prompt">
                <span className="upload-icon">☁️</span>
                <p>Drop your 3D file here or click to browse</p>
                <p className="file-types">Supports: STL, OBJ, 3MF, PLY (Max 100MB)</p>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl,.obj,.3mf,.ply"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* [@aduy0] - Upload button */}
      {uploadState.file && !uploadState.uploaded && (
        <button 
          className="upload-button"
          onClick={uploadFile}
          disabled={uploadState.uploading}
        >
          {uploadState.uploading ? '🔄 Uploading...' : '🚀 Upload & Analyze'}
        </button>
      )}

      {/* [@aduy0] - File info and print options */}
      {uploadState.uploaded && uploadState.fileInfo && (
        <div className="upload-success">
          <div className="file-info">
            <h3>✅ File Uploaded Successfully!</h3>
            <div className="file-details">
              <p><strong>File:</strong> {uploadState.fileInfo.originalName}</p>
              <p><strong>Size:</strong> {uploadState.fileInfo.size}</p>
              <p><strong>Type:</strong> {uploadState.fileInfo.type}</p>
              <p><strong>Upload ID:</strong> {uploadState.fileInfo.id}</p>
            </div>
          </div>

          {/* [@aduy0] - Print customization options */}
          <div className="print-options">
            <h3>🎛️ Customize Your Print</h3>
            
            <div className="option-group">
              <label>Material:</label>
              <select 
                value={uploadState.printOptions.material}
                onChange={(e) => handlePrintOptionChange('material', e.target.value)}
              >
                <option value="PLA">PLA (Beginner Friendly)</option>
                <option value="ABS">ABS (Durable)</option>
                <option value="PETG">PETG (Strong & Clear)</option>
                <option value="TPU">TPU (Flexible)</option>
              </select>
            </div>

            <div className="option-group">
              <label>Print Quality:</label>
              <select 
                value={uploadState.printOptions.quality}
                onChange={(e) => handlePrintOptionChange('quality', e.target.value)}
              >
                <option value="Draft">Draft (Fast, 0.3mm layers)</option>
                <option value="Standard">Standard (Balanced, 0.2mm layers)</option>
                <option value="High">High Quality (Detailed, 0.15mm layers)</option>
                <option value="Ultra">Ultra High (Premium, 0.1mm layers)</option>
              </select>
            </div>

            <div className="option-group">
              <label>Infill Density: {uploadState.printOptions.infill}%</label>
              <input 
                type="range"
                min="10"
                max="100"
                value={uploadState.printOptions.infill}
                onChange={(e) => handlePrintOptionChange('infill', parseInt(e.target.value))}
              />
              <small>Higher infill = stronger but more expensive</small>
            </div>

            <div className="option-group">
              <label>Wall Thickness:</label>
              <select 
                value={uploadState.printOptions.walls}
                onChange={(e) => handlePrintOptionChange('walls', parseInt(e.target.value))}
              >
                <option value="2">2 layers (Light)</option>
                <option value="3">3 layers (Standard)</option>
                <option value="4">4 layers (Strong)</option>
                <option value="6">6 layers (Maximum Strength)</option>
              </select>
            </div>

            <div className="option-group">
              <label>Support Structures:</label>
              <select 
                value={uploadState.printOptions.supports}
                onChange={(e) => handlePrintOptionChange('supports', e.target.value)}
              >
                <option value="None">None (Simple shapes only)</option>
                <option value="Auto">Auto (Recommended)</option>
                <option value="Everywhere">Everywhere (Complex shapes)</option>
              </select>
            </div>
          </div>

          {/* [@aduy0] - Price display */}
          {uploadState.estimatedPrice && (
            <div className="price-display">
              <h3>💰 Estimated Price</h3>
              <div className="price-breakdown">
                <p className="total-price">${uploadState.estimatedPrice.base} USD</p>
                <small>*Final price may vary based on actual print time and material usage</small>
              </div>
              <button className="add-to-cart-button">
                🛒 Add to Cart - ${uploadState.estimatedPrice.base}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;