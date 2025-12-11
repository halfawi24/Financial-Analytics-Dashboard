'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FileUploadCardProps {
  onFilesAccepted?: (files: File[]) => void;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export function FileUploadCard({ onFilesAccepted }: FileUploadCardProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragActive(false);
    
    // Validate files
    const validFiles: UploadedFile[] = acceptedFiles.map(file => {
      if (!['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type) && !file.name.endsWith('.csv')) {
        return { file, status: 'error', error: 'Invalid file type. Use CSV or Excel.' };
      }
      if (file.size > 5 * 1024 * 1024) {
        return { file, status: 'error', error: 'File too large. Max 5MB.' };
      }
      return { file, status: 'success' };
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
    
    const successFiles = validFiles.filter(f => f.status === 'success').map(f => f.file);
    if (successFiles.length > 0 && onFilesAccepted) {
      onFilesAccepted(successFiles);
    }
  }, [onFilesAccepted]);

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
      <h3 className="text-lg font-bold text-slate-900 mb-4">Import Financial Data</h3>
      
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
            <p className="text-xs text-slate-500 mt-1">CSV, Excel (XLS, XLSX) • Max 5MB per file</p>
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
          <h4 className="text-sm font-semibold text-slate-900">Uploaded Files</h4>
          {uploadedFiles.map((item, idx) => (
            <motion.div
              key={`${item.file.name}-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-3 rounded-lg ${
                item.status === 'success' ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className={`h-5 w-5 flex-shrink-0 ${
                  item.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.file.name}</p>
                  {item.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">{item.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {item.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
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

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button className="flex-1 px-4 py-2 bg-slate-100 text-slate-900 rounded-lg font-medium hover:bg-slate-200 transition-colors">
          Preview Data
        </button>
        <button className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors">
          Map Columns
        </button>
      </div>
    </motion.div>
  );
}
