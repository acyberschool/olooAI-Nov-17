import React from 'react';

interface ChatInterfaceProps {
  isVisible: boolean;
  onClose: () => void;
  liveUserTranscript: string;
  liveAssistantTranscript: string;
  lastUserTranscript: string;
  lastAssistantTranscript: string;
  isThinking: boolean;
  isSpeaking: boolean;
  error: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isVisible,
  onClose,
  liveUserTranscript,
  liveAssistantTranscript,
  lastUserTranscript,
  lastAssistantTranscript,
  isThinking,
  isSpeaking,
  error
}) => {
  const isLive = liveUserTranscript || liveAssistantTranscript || isThinking || isSpeaking;
  const userText = isLive ? liveUserTranscript : lastUserTranscript;
  const assistantText = isLive ? liveAssistantTranscript : lastAssistantTranscript;

  const hasContent = userText || assistantText || isThinking || error;

  if (!isVisible || !hasContent) {
    return null;
  }
  
  return (
    <div className="fixed bottom-32 right-8 w-full max-w-md bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-xl p-4 border border-gray-700 text-sm">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white" aria-label="Close chat">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {error && <p className="text-red-400 mb-2">{error}</p>}

      {userText && (
        <div className="text-gray-300 pr-6">
          <strong className="text-indigo-400">You:</strong> {userText}
        </div>
      )}

      {assistantText && (
        <div className="mt-2 text-gray-100 pr-6">
          <strong className="text-teal-400">Assistant:</strong> {assistantText}
          {isSpeaking && <span className="inline-block w-1 h-4 bg-teal-400 ml-1 animate-pulse" />}
        </div>
      )}

      {isThinking && (
        <div className="mt-2 text-gray-400 italic flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          Thinking...
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
