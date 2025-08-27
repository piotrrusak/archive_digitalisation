import { useRef, useState, useCallback } from 'react';
import { UploadCloud, X } from 'lucide-react';

export interface DropzoneProps {
    acceptExtensions: string[];
    maxFileSizeMB: number;
    multiple?: boolean;
    onFileSelected: (file: File) => void;
};

export default function Dropzone({
    acceptExtensions,
    maxFileSizeMB,
    multiple = false,
    onFileSelected,
}: DropzoneProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
    const acceptAttr = acceptExtensions.map((e) => `.${e}`).join(',');
    const extListReadable = acceptExtensions.join(', ');
  
    const validate = useCallback(
        (file: File): string | null => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (!ext || !acceptExtensions.includes(ext)) {
                return `This file type is not supported. Allowed: ${extListReadable}.`;
            }
            const maxBytes = maxFileSizeMB * 1024 * 1024;
            if (file.size > maxBytes) {
                return `File is too large. Max size is ${String(maxFileSizeMB)} MB.`;
            }
            if (!multiple && selectedFile) {
                return 'Only one file can be uploaded at a time.';
            }
            return null;
        },
        [acceptExtensions, extListReadable, maxFileSizeMB, multiple, selectedFile],
    );
  
    const handleFiles = useCallback(
        (files: FileList | null) => {
            if (!files || files.length === 0) return;
            const file = files[0];
            const err = validate(file);
            if (err) {
                setError(err);
                return;
            }
            setError(null);
            setSelectedFile(file);
            onFileSelected(file);
        },
        [onFileSelected, validate],
    );
  
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };
  
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };
  
    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };
  
    const openFileDialog = () => {
       inputRef.current?.click();
    };
  
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFileDialog();
        }
    };
  
    const clearSelection = () => {
        setSelectedFile(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = '';
    };
  
    return (
        <div className="w-full">
            <div
                role="button"
                tabIndex={0}
                aria-label="File upload area"
                className={[
                    'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition',
                    dragActive ? 'border-blue-400 bg-blue-950/30' : 'border-gray-400/40 hover:border-gray-300',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    'min-h-60 bg-gray-700',
                ].join(' ')}
                onClick={openFileDialog}
                onKeyDown={onKeyDown}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
            >
                <UploadCloud className="mb-3 h-10 w-10 opacity-90" aria-hidden="true" />
                <p className="text-lg font-medium">Drag & drop a file here, or click to browse</p>
                <p className="mt-2 text-sm opacity-80">
                    Accepted: {extListReadable}. Max size: {maxFileSizeMB} MB.
                </p>
        
                <input
                    ref={inputRef}
                    type="file"
                    accept={acceptAttr}
                    multiple={multiple}
                    className="hidden"
                    onChange={(e) => {
                      handleFiles(e.target.files);
                    }}
                />
            </div>
      
            {selectedFile && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-700 px-4 py-3">
                    <div className="truncate">
                        <div className="font-medium">{selectedFile.name}</div>
                        <div className="text-sm opacity-80">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Remove selected file"
                    >
                        <X className="h-4 w-4" />
                        Remove
                    </button>
                </div>
            )}
      
            {error && (
                <div role="alert" className="mt-3 rounded-lg bg-red-900/40 px-3 py-2 text-red-200">
                    {error}
                </div>
            )}
        </div>
    );
}
