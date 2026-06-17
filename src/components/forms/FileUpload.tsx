
import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, FileText } from 'lucide-react';

export interface FileUploadProps {
  /** Accepted file types (e.g., "image/*,.pdf") */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Called with selected file(s) */
  onUpload: (files: File[]) => void;
  /** Label above the upload area */
  label?: string;
  /** Helper text below the area */
  helperText?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export function FileUpload({
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onUpload,
  label,
  helperText,
  multiple = false,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (fileList: FileList | File[]): File[] => {
      const validFiles: File[] = [];
      const fileArray = Array.from(fileList);

      for (const file of fileArray) {
        if (file.size > maxSize) {
          setError(`File "${file.name}" exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`);
          return [];
        }
        validFiles.push(file);
      }

      setError(null);
      return validFiles;
    },
    [maxSize]
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const valid = validateFiles(fileList);
      if (valid.length > 0) {
        setFiles(valid);
        onUpload(valid);
      }
    },
    [validateFiles, onUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onUpload(updated);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
          'hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-slate-600',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium text-blue-600 dark:text-blue-400">Click to upload</span>{' '}
          or drag and drop
        </p>
        {helperText && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Error */}
      {error && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>}

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2"
            >
              <FileText className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                {file.name}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-0.5 rounded text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
