export enum AppStep {
  AUTH = 'AUTH',
  UPLOAD = 'UPLOAD',
  TRANSCRIBE = 'TRANSCRIBE',
  MINUTES = 'MINUTES',
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface MeetingData {
  fileName: string;
  fileType: string;
  transcript: string;
  minutes: string;
}

export interface ProcessingState {
  status: ProcessingStatus;
  message: string;
  error?: string;
}

// Extend the Window interface to include aistudio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}