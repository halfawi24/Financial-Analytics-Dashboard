'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { parseFinancialFile } from '@/lib/file-parser';
import type { FinancialAssumptions } from '@/lib/financial-engine';

interface FileUploadCardEnhancedProps {
  onAssumptionsExtracted?: (assumptions: Partial<FinancialAssumptions>) => void;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'parsing' | 'success' | 'error';
  error?: string;
  confidence?: number;
  mappedFields?: string[];
}

export function FileUploadCardEnhanced({ onAssumptionsExtracted }: FileUploadCardEnhancedProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsDragActive(false);

      const validFiles: UploadedFile[] = acceptedFiles.map(file => {
        if (
          ![
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ].includes(file.type) &&
          !file.name.endsWith('.csv') &&
          !file.name.endsWith('.xlsx') &&
          !file.name.endsWith('.xls')
        ) {
          return { file, status: 'error' as const, error: 'Invalid file type. Use CSV or Excel.' };
        }
        if (file.size > 5 * 1024 * 1024) {
          return { file, status: 'error' as const, error: 'File too large. Max 5MB.' };
        }
        return { file, status: 'parsing' as const };
      });

      setUploadedFiles(prev => [...prev, ...validFiles]);

      // Process files and extract assumptions via server API
      for (const uploadFile of validFiles) {
        if (uploadFile.status === 'parsing') {
          try {
            // Send to server extraction API
            const formData = new FormData();
            formData.append('file', uploadFile.file);
            
            console.log('📤 Uploading file to extraction API:', uploadFile.file.name);
            
            // Try Claude API first (most reliable), fallback to local extraction
            let result = null;
            let usedCloud = false;
            
            try {
              // Try cloud extraction first (Claude API)
              console.log('🌐 Attempting cloud extraction via Claude API...');
              const cloudResponse = await fetch('/api/extract-file-claude', {
                method: 'POST',
                body: formData,
              });
              
              if (cloudResponse.ok) {
                result = await cloudResponse.json();
                if (result.success) {
                  usedCloud = true;
                  console.log('✓ Cloud extraction successful via Claude API');
                }
              }
            } catch (cloudErr) {
              console.log('⚠️  Cloud extraction failed, trying local extraction...');
            }
            
            // Fallback to local extraction if cloud failed
            if (!result || !result.success) {
              console.log('📦 Attempting local extraction...');
              // Reset formData for second request
              const formData2 = new FormData();
              formData2.append('file', uploadFile.file);
              
              const response = await fetch('/api/extract-file', {
                method: 'POST',
                body: formData2,
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
              }

              result = await response.json();
              if (!result.success) {
                throw new Error(result.error || 'Extraction failed');
              }
              console.log('✓ Local extraction successful');
            }

            console.log('✓ Extraction successful:', result);
            
            // Update file status with extracted data
            setUploadedFiles(prev =>
              prev.map(f =>
                f.file === uploadFile.file
                  ? {
                      ...f,
                      status: 'success' as const,
                      confidence: result.confidence || 0,
                      mappedFields: result.mappedFields,
                    }
                  : f
              )
            );

            // Notify parent component with extracted assumptions
            if (onAssumptionsExtracted && result.assumptions) {
              const filteredAssumptions = Object.fromEntries(
                Object.entries(result.assumptions).filter(([key, v]) => v !== undefined && v !== null && key)
              );
              console.log('✓ Sending extracted assumptions to dashboard:', filteredAssumptions);
              onAssumptionsExtracted(filteredAssumptions as Partial<FinancialAssumptions>);
            }
          } catch (error) {
            console.error('✗ Extraction error:', error);
            setUploadedFiles(prev =>
              prev.map(f =>
                f.file === uploadFile.file
                  ? {
                      ...f,
                      status: 'error' as const,
                      error: error instanceof Error ? error.message : 'Failed to parse file',
                    }
                  : f
              )
            );
          }
        }
      }
    },
    [onAssumptionsExtracted]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const removeFile = (idx: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== idx));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
        <Zap className="h-5 w-5 text-amber-500" />
        Smart File Import
      </h3>
      <p className="text-sm text-slate-600 mb-4">
        Upload CSV or Excel files. We'll automatically detect and extract financial data.
      </p>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all ${
          isDragActive
            ? 'border-teal-500 bg-teal-50'
            : 'border-teal-300 bg-slate-50 hover:border-teal-500 hover:bg-teal-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <Upload className="h-8 w-8 text-teal-600" />
          <div>
            <p className="font-semibold text-slate-900">Drag files here or click to upload</p>
            <p className="text-xs text-slate-500 mt-1">CSV, Excel (XLS, XLSX) • Max 5MB</p>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 space-y-2"
        >
          <h4 className="text-sm font-semibold text-slate-900">
            Uploaded Files ({uploadedFiles.filter(f => f.status === 'success').length}/{uploadedFiles.length})
          </h4>
          {uploadedFiles.map((item, idx) => (
            <motion.div
              key={`${item.file.name}-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-3 rounded-lg ${
                item.status === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : item.status === 'parsing'
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File
                  className={`h-5 w-5 flex-shrink-0 ${
                    item.status === 'success'
                      ? 'text-green-600'
                      : item.status === 'parsing'
                        ? 'text-blue-600'
                        : 'text-red-600'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.file.name}</p>
                  {item.status === 'parsing' && (
                    <p className="text-xs text-blue-600 mt-1">Extracting data...</p>
                  )}
                  {item.status === 'success' && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {item.mappedFields?.length || 0} fields detected (
                      {item.confidence || 0}% confidence)
                    </p>
                  )}
                  {item.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">{item.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {item.status === 'parsing' && (
                  <div className="animate-spin">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                {item.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                <button
                  onClick={() => removeFile(idx)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Info Box with Enhanced UX */}
      <div className="mt-6 space-y-3">
        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
          <p className="text-xs text-teal-900 font-semibold mb-2">🚀 Full Automation Enabled</p>
          <p className="text-xs text-teal-800 leading-relaxed">
            <strong>One-Click Import:</strong> Upload your file, and our AI automatically extracts financial data, 
            calculates metrics, and populates your dashboard. No manual data entry needed. Everything updates in real-time.
          </p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>Supported Formats:</strong> CSV, Excel (.xls, .xlsx) | <strong>Max Size:</strong> 5MB
          </p>
        </div>
      </div>
    </motion.div>
  );
}
