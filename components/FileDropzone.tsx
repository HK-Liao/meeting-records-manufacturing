import React, { useRef, useState } from 'react';
import { formatFileSize } from '../utils/fileHelpers';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileSelect, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  const validateAndPassFile = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('Please upload a valid audio file.');
      return;
    }
    
    const LIMIT_MB = 200;
    // Check file size (200MB limit)
    if (file.size > LIMIT_MB * 1024 * 1024) {
      alert(`File is too large (limit ${LIMIT_MB}MB).`);
      return;
    }
    onFileSelect(file);
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      className={`relative w-full p-10 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out text-center cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-300' : 
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 bg-white'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={!disabled ? handleDrop : undefined}
      onClick={!disabled ? onButtonClick : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="audio/*" // Accepts mp3, wav, m4a etc.
        onChange={handleChange}
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium text-gray-700">
            {dragActive ? "Drop the audio file here" : "Click to upload or drag & drop"}
          </p>
          <p className="text-sm text-gray-500 mt-1">MP3, WAV, M4A (Max 200MB)</p>
        </div>
      </div>
    </div>
  );
};

export default FileDropzone;