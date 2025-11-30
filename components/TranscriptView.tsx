import React from 'react';
import { ProcessingState, ProcessingStatus } from '../types';

interface TranscriptViewProps {
  transcript: string;
  fileName: string;
  onTranscriptChange: (newTranscript: string) => void;
  onGenerateMinutes: () => void;
  processingState: ProcessingState;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  fileName,
  onTranscriptChange,
  onGenerateMinutes,
  processingState,
}) => {
  const isProcessing = processingState.status === ProcessingStatus.PROCESSING;

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.split('.')[0]}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Transcript Editor</h2>
          <p className="text-sm text-gray-500">Review the auto-refined transcript.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            title="Download Transcript"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m0 0l-3 3m3-3v12" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9" className="hidden" /> {/* Force consistent icon size */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15l3-3m0 0l3 3m-3-3v12" className="hidden" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
            </svg>
          </button>
          
          <button
            onClick={onGenerateMinutes}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            Generate Minutes
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="relative flex-1">
        <textarea
          className="w-full h-full p-6 text-gray-700 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder="Transcription will appear here..."
          spellCheck={false}
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
              <p className="text-indigo-800 font-medium">{processingState.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptView;