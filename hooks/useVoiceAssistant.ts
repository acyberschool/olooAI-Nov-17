import { useState, useRef, useCallback, useEffect } from 'react';
import { LiveSession, LiveServerMessage } from '@google/genai';
import { connectToLiveSession, decode, decodeAudioData, createPcmBlob } from '../services/geminiService';
import { KanbanStatus, Task, Client, BusinessLine, Deal, CRMEntryType } from '../types';

interface UseVoiceAssistantProps {
  onBoardItemCreate: (itemData: Partial<Task>) => string;
  onCrmEntryCreate: (data: { interactionType: CRMEntryType, content: string, clientName?: string, dealName?: string }) => string;
  onTaskUpdate: (taskTitle: string, newStatus: KanbanStatus) => string;
  onBusinessLineCreate: (data: Omit<BusinessLine, 'id'>) => Promise<string> | string;
  onClientCreate: (data: Omit<Client, 'id'>) => string;
  onDealCreate: (data: Omit<Deal, 'id' | 'status'> & {clientName: string}) => string;
  onDealStatusUpdate: (dealId: string, newStatus: 'Open' | 'Closed') => string;
  onTurnComplete?: (userTranscript: string, assistantTranscript: string) => void;
  onGetOpportunities?: (data: any) => Promise<string>;
  onGetClientOpportunities?: (data: any) => Promise<string>;
  onGetDealOpportunities?: (data: any) => Promise<string>;
  currentBusinessLineId?: string | null;
  currentClientId?: string | null;
  currentDealId?: string | null;
}

export const useVoiceAssistant = ({ 
  onBoardItemCreate,
  onCrmEntryCreate,
  onTaskUpdate, 
  onBusinessLineCreate, 
  onClientCreate, 
  onDealCreate,
  onDealStatusUpdate,
  onTurnComplete,
  onGetOpportunities,
  onGetClientOpportunities,
  onGetDealOpportunities,
  currentBusinessLineId,
  currentClientId,
  currentDealId,
}: UseVoiceAssistantProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  
  const userTranscriptRef = useRef('');
  const assistantTranscriptRef = useRef('');

  const cleanup = useCallback(() => {
    // Stop microphone stream
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    // Disconnect audio processor
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    // Close audio contexts
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close().catch(console.error);
    }
    // Stop any playing audio
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();

    // Close Live API session
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
  }, []);

  const handleMessage = async (message: LiveServerMessage) => {
    setError(null);

    if (message.serverContent?.inputTranscription) {
        setUserTranscript((prev) => {
            const next = prev + message.serverContent.inputTranscription.text;
            userTranscriptRef.current = next;
            return next;
        });
    }
    if (message.serverContent?.outputTranscription) {
      setIsThinking(false);
      setIsSpeaking(true);
      setAssistantTranscript((prev) => {
          const next = prev + message.serverContent.outputTranscription.text;
          assistantTranscriptRef.current = next;
          return next;
      });
    }
    
    if (message.toolCall) {
      setIsThinking(true);
      for (const fc of message.toolCall.functionCalls) {
        let result: string | Promise<string> = "An unknown error occurred.";

        let finalArgs = { ...fc.args };

        // Inject context: If we are in a specific view, add the relevant ID
        if (currentDealId) {
            if (['createBoardItem', 'createCrmEntry'].includes(fc.name)) {
                finalArgs.dealId = currentDealId;
            }
        } else if (currentClientId) {
            if (['createBoardItem', 'createDeal', 'createCrmEntry'].includes(fc.name)) {
                finalArgs.clientId = currentClientId;
            }
        } else if (currentBusinessLineId) {
            if (['createBoardItem', 'createClient', 'createDeal', 'createCrmEntry'].includes(fc.name)) {
                finalArgs.businessLineId = currentBusinessLineId;
            }
        }
        
        switch (fc.name) {
            case 'createCrmEntry':
                result = onCrmEntryCreate(finalArgs);
                break;
            case 'createBoardItem':
                result = onBoardItemCreate(finalArgs);
                break;
            case 'moveTask':
                result = onTaskUpdate(finalArgs.taskTitle, finalArgs.newStatus as KanbanStatus);
                break;
            case 'createBusinessLine':
                result = onBusinessLineCreate(finalArgs);
                break;
            case 'createClient':
                result = onClientCreate(finalArgs);
                break;
            case 'createDeal':
                result = onDealCreate(finalArgs);
                break;
            case 'updateDealStatus':
                if (currentDealId) { // Should only be called from within a deal
                    result = onDealStatusUpdate(currentDealId, finalArgs.newStatus);
                } else {
                    result = "I can only change the status of a deal you are currently viewing.";
                }
                break;
            case 'getOpportunities':
                if (onGetOpportunities) result = onGetOpportunities(finalArgs);
                break;
            case 'getClientOpportunities':
                if (onGetClientOpportunities) result = onGetClientOpportunities(finalArgs);
                break;
            case 'getDealOpportunities':
                if (onGetDealOpportunities) result = onGetDealOpportunities(finalArgs);
                break;
        }

        const finalResult = await Promise.resolve(result);

        sessionPromiseRef.current?.then((session) => {
          session.sendToolResponse({
            functionResponses: { id: fc.id, name: fc.name, response: { result: finalResult } },
          });
        });
      }
    }

    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
    if (audioData && outputAudioContextRef.current) {
      setIsThinking(false);
      setIsSpeaking(true);
      const audioBuffer = await decodeAudioData(
        decode(audioData),
        outputAudioContextRef.current,
        24000,
        1,
      );
      const source = outputAudioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioContextRef.current.destination);
      source.addEventListener('ended', () => {
        audioSourcesRef.current.delete(source);
        if (audioSourcesRef.current.size === 0) {
          setIsSpeaking(false);
        }
      });
      const currentTime = outputAudioContextRef.current.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
      audioSourcesRef.current.add(source);
    }

    if (message.serverContent?.turnComplete) {
      onTurnComplete?.(userTranscriptRef.current, assistantTranscriptRef.current);
      userTranscriptRef.current = '';
      assistantTranscriptRef.current = '';
      setUserTranscript('');
      setAssistantTranscript('');
    }
  };
  
  const startRecording = async () => {
    if (isRecording) return;
    setError(null);
    userTranscriptRef.current = '';
    assistantTranscriptRef.current = '';
    setUserTranscript('');
    setAssistantTranscript('');
    setIsConnecting(true);
    
    try {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;
        
        sessionPromiseRef.current = connectToLiveSession({
            onOpen: () => {
                setIsConnecting(false);
                setIsRecording(true);
                const source = audioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                
                scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    sessionPromiseRef.current?.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };

                source.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(audioContextRef.current!.destination);
            },
            onMessage: handleMessage,
            onError: (e) => {
                console.error("Live session error:", e);
                setError("Connection error. Please try again.");
                stopRecording();
            },
            onClose: () => {
                setIsRecording(false);
            },
        });
    } catch (err) {
        console.error("Failed to start recording:", err);
        setError("Could not access microphone. Please check permissions.");
        setIsConnecting(false);
        cleanup();
    }
  };

  const stopRecording = useCallback(() => {
    if (!isRecording && !isConnecting) return;
    setIsRecording(false);
    setIsConnecting(false);
    setIsThinking(false);
    setIsSpeaking(false);
    cleanup();
  }, [isRecording, isConnecting, cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  return {
    isConnecting,
    isRecording,
    isSpeaking,
    isThinking,
    userTranscript,
    assistantTranscript,
    error,
    startRecording,
    stopRecording,
  };
};