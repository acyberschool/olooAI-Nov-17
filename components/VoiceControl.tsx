
import React from 'react';

interface VoiceControlProps {
  isConnecting: boolean;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 10.5a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V15a.5.5 0 01.5-.5zM5 15a.5.5 0 00-1 0v.5a.5.5 0 001 0V15zm10 0a.5.5 0 00-1 0v.5a.5.5 0 001 0V15zM7 15a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V15a.5.5 0 01.5-.5zm5 0a.5.5 0 00-1 0v.5a.5.5 0 001 0V15z" clipRule="evenodd" />
        <path d="M5 10a5 5 0 0010 0h-1.5a3.5 3.5 0 11-7 0H5z" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
);

const Spinner = () => (
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const VoiceControl: React.FC<VoiceControlProps> = ({
  isConnecting,
  isRecording,
  startRecording,
  stopRecording,
}) => {
  const handleClick = () => {
    if (isRecording || isConnecting) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  let buttonContent = <MicIcon />;
  let buttonClass = "bg-indigo-600 hover:bg-indigo-700";
  if (isConnecting) {
    buttonContent = <Spinner />;
    buttonClass = "bg-gray-500 cursor-not-allowed";
  } else if (isRecording) {
    buttonContent = <StopIcon />;
    buttonClass = "bg-red-600 hover:bg-red-700 animate-pulse";
  }

  return (
    <div className="fixed bottom-8 right-8">
      <button
        onClick={handleClick}
        disabled={isConnecting}
        className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 ${buttonClass}`}
      >
        {buttonContent}
      </button>
    </div>
  );
};

export default VoiceControl;
