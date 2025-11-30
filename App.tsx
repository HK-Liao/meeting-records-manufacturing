import React, { useState, useEffect } from 'react';
import { AppStep, ProcessingStatus, ProcessingState, MeetingData } from './types';
import FileDropzone from './components/FileDropzone';
import TranscriptView from './components/TranscriptView';
import MinutesView from './components/MinutesView';
import { fileToBase64 } from './utils/fileHelpers';
import { transcribeAudio, correctTranscript, generateMeetingMinutes } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.AUTH);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: ProcessingStatus.IDLE,
    message: '',
  });
  
  const [data, setData] = useState<MeetingData>({
    fileName: '',
    fileType: '',
    transcript: '',
    minutes: '',
  });

  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Check for existing API key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        // IDX/AI Studio Environment
        if (await window.aistudio.hasSelectedApiKey()) {
            setStep(AppStep.UPLOAD);
        } else {
            setStep(AppStep.AUTH);
        }
      } else {
        // Local / Production Environment
        // Check if API_KEY is injected via environment variables (e.g., .env file)
        if (process.env.API_KEY) {
          setStep(AppStep.UPLOAD);
        } else {
          // Stay on AUTH to show setup instructions
          setStep(AppStep.AUTH);
        }
      }
    };
    checkKey();
  }, []);

  // Handle IDX API Key Selection
  const handleApiKeySelection = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setStep(AppStep.UPLOAD);
      }
    } catch (e) {
      console.error(e);
      handleError(e, "Failed to select API Key. Please try again.");
    }
  };

  // Helper to handle API errors
  const handleError = (error: any, message: string) => {
    console.error(error);
    if (error.message && error.message.includes("Requested entity was not found")) {
         setProcessingState({
            status: ProcessingStatus.ERROR,
            message: "API Key Error: Please re-select your API Key.",
            error: error.message
         });
         setStep(AppStep.AUTH);
    } else {
        setProcessingState({
            status: ProcessingStatus.ERROR,
            message: message,
            error: error.message || "An unknown error occurred",
        });
    }
  };

  const handleFileSelect = async (file: File) => {
    setAudioFile(file);
    setData(prev => ({ ...prev, fileName: file.name, fileType: file.type }));
    setProcessingState({ status: ProcessingStatus.PROCESSING, message: 'Transcribing audio... (Step 1/2)' });
    
    try {
      const base64Audio = await fileToBase64(file);
      const rawTranscript = await transcribeAudio(base64Audio, file.type);
      
      setProcessingState({ status: ProcessingStatus.PROCESSING, message: 'Refining transcript with AI... (Step 2/2)' });
      const refinedTranscript = await correctTranscript(rawTranscript);
      
      setData(prev => ({ ...prev, transcript: refinedTranscript }));
      setStep(AppStep.TRANSCRIBE);
      setProcessingState({ status: ProcessingStatus.SUCCESS, message: 'Processing complete' });
    } catch (error) {
      handleError(error, 'Failed to process audio.');
    }
  };

  const handleGenerateMinutes = async () => {
    if (!data.transcript) return;

    setProcessingState({ status: ProcessingStatus.PROCESSING, message: 'Generating meeting minutes...' });
    try {
      const minutes = await generateMeetingMinutes(data.transcript);
      setData(prev => ({ ...prev, minutes }));
      setStep(AppStep.MINUTES);
      setProcessingState({ status: ProcessingStatus.SUCCESS, message: 'Minutes generated' });
    } catch (error) {
      handleError(error, 'Failed to generate minutes.');
    }
  };

  const resetApp = () => {
    setStep(AppStep.UPLOAD);
    setData({ fileName: '', fileType: '', transcript: '', minutes: '' });
    setAudioFile(null);
    setProcessingState({ status: ProcessingStatus.IDLE, message: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">MeetingMind AI</h1>
          </div>
          
          {/* Steps Indicator - Only show if authenticated */}
          {step !== AppStep.AUTH && (
            <div className="hidden md:flex items-center space-x-2 text-sm font-medium">
              <div 
                onClick={() => setStep(AppStep.UPLOAD)}
                className={`px-3 py-1 rounded-full cursor-pointer ${step === AppStep.UPLOAD ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600'}`}
              >
                1. Upload
              </div>
              <div className="text-gray-300">→</div>
              <div 
                onClick={() => (step === AppStep.MINUTES || step === AppStep.TRANSCRIBE) && setStep(AppStep.TRANSCRIBE)}
                className={`px-3 py-1 rounded-full transition-colors ${
                    step === AppStep.TRANSCRIBE 
                        ? 'bg-indigo-100 text-indigo-700 cursor-default' 
                        : (step === AppStep.MINUTES ? 'text-indigo-600 hover:bg-indigo-50 cursor-pointer' : 'text-gray-400')
                }`}
              >
                2. Review
              </div>
              <div className="text-gray-300">→</div>
              <div className={`px-3 py-1 rounded-full ${step === AppStep.MINUTES ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400'}`}>3. Minutes</div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Notification */}
        {processingState.status === ProcessingStatus.ERROR && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-600 mt-0.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error Occurred</h3>
              <p className="text-sm text-red-700 mt-1">{processingState.error || processingState.message}</p>
              <button 
                onClick={() => setProcessingState({ status: ProcessingStatus.IDLE, message: '' })}
                className="mt-2 text-xs font-medium text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto h-[600px] flex flex-col">
          
          {/* Auth Step */}
          {step === AppStep.AUTH && (
             <div className="my-auto text-center px-4 animate-fade-in">
               <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 max-w-lg mx-auto">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to MeetingMind</h2>
                 <p className="text-gray-600 mb-8">
                   {window.aistudio ? "Connect your Google account to access Gemini AI." : "Please configure your API Key to proceed."}
                 </p>
                 
                 {/* Only show connect button if aistudio is available (IDX Environment) */}
                 {window.aistudio ? (
                   <button 
                     onClick={handleApiKeySelection}
                     className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                   >
                     <span>Connect Google Account</span>
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                     </svg>
                   </button>
                 ) : (
                    // Instructions for Local/Production Environment
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 text-left text-sm text-yellow-800">
                         <h3 className="font-semibold mb-2 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                             </svg>
                             API Key Missing
                         </h3>
                         <p className="mb-3">To use this app, you must configure the API Key via environment variables.</p>
                         <ol className="list-decimal list-inside space-y-1 ml-1">
                           <li>Create a <code>.env</code> file in the project root.</li>
                           <li>Add <code>API_KEY=your_gemini_key</code> inside it.</li>
                           <li>Restart the application.</li>
                         </ol>
                         <div className="mt-4 pt-4 border-t border-yellow-200">
                           <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-yellow-900">
                             Get a free Gemini API Key →
                           </a>
                         </div>
                    </div>
                 )}
               </div>
             </div>
          )}

          {/* Upload Step */}
          {step === AppStep.UPLOAD && (
            <div className="my-auto animate-fade-in">
              <FileDropzone 
                onFileSelect={handleFileSelect} 
                disabled={processingState.status === ProcessingStatus.PROCESSING}
              />
            </div>
          )}

          {/* Transcript Step */}
          {step === AppStep.TRANSCRIBE && (
             <TranscriptView
               transcript={data.transcript}
               fileName={data.fileName}
               onTranscriptChange={(newText) => setData(prev => ({ ...prev, transcript: newText }))}
               onGenerateMinutes={handleGenerateMinutes}
               processingState={processingState}
             />
          )}

          {/* Minutes Step */}
          {step === AppStep.MINUTES && (
            <MinutesView
              minutes={data.minutes}
              fileName={data.fileName}
              onBack={() => setStep(AppStep.TRANSCRIBE)}
              onReset={resetApp}
            />
          )}

        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>© 2024 MeetingMind AI. Open Source under MIT License.</p>
      </footer>
    </div>
  );
};

export default App;