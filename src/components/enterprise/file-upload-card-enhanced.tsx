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
          !file.name.endsWith('.csv')
        ) {
          return { file, status: 'error' as const, error: 'Invalid file type. Use CSV or Excel.' };
        }
        if (file.size > 5 * 1024 * 1024) {
          return { file, status: 'error' as const, error: 'File too large. Max 5MB.' };
        }
        return { file, status: 'parsing' as const };
      });

      setUploadedFiles(prev => [...prev, ...validFiles]);

      // Process files and extract assumptions
      for (const uploadFile of validFiles) {
        if (uploadFile.status === 'parsing') {
          try {
            const result = await parseFinancialFile(uploadFile.file);
            
            // Update file status
            setUploadedFiles(prev =>
              prev.map(f =>
                f.file === uploadFile.file
                  ? {
                      ...f,
                      status: 'success' as const,
                      confidence: result.confidence,
                      mappedFields: result.mappedFields,
                    }
                  : f
              )
            );

            // Notify parent component
            if (onAssumptionsExtracted) {
              onAssumptionsExtracted(result.assumptions);
            }
          } catch (error) {
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

      {/* Info Box */}
      <div className="mt-6 p-4 bg-teal-50 rounded-lg">
        <p className="text-xs text-teal-900">
          💡 <strong>Auto-Extraction:</strong> Our system automatically detects financial fields
          (Revenue, COGS, OpEx, EBITDA, etc.) and fills your assumptions form. Adjust as needed.
        </p>
      </div>
    </motion.div>
  );
}
