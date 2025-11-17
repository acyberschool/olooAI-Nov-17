import React from 'react';

interface VoiceControlProps {
  isConnecting: boolean;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h6v4H9z" />
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
  let animationClass = "animate-spin-slow";
  let buttonClass = "bg-brevo-cta hover:bg-brevo-cta-hover opacity-70 blur-sm";
  
  if (isConnecting) {
    buttonContent = <Spinner />;
    animationClass = "";
    buttonClass = "bg-gray-500 cursor-not-allowed opacity-100 blur-0";
  } else if (isRecording) {
    buttonContent = <StopIcon />;
    animationClass = "animate-pulse";
    buttonClass = "bg-red-600 hover:bg-red-700 opacity-100 blur-0";
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
        <button
            onClick={handleClick}
            disabled={isConnecting}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 transform hover:scale-110 hover:opacity-100 hover:blur-0 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-green-700 ${buttonClass} ${animationClass}`}
            >
            {buttonContent}
        </button>
    </div>
  );
};

export default VoiceControl;