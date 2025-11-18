
import { useState, useRef, useCallback, useEffect } from 'react';
import { connectToLiveSession, decode, decodeAudioData, createPcmBlob } from '../services/geminiService';
import { KanbanStatus, Task, Client, BusinessLine, Deal, CRMEntryType, Project } from '../types';

type LiveSession = Awaited<ReturnType<typeof connectToLiveSession>>;

interface UseVoiceAssistantProps {
  onBoardItemCreate: (itemData: Partial<Task>) => string;
  onCrmEntryCreate: (data: { interactionType: CRMEntryType, content: string, clientName?: string, dealName?: string }) => string;
  onTaskUpdate: (taskTitle: string, newStatus: KanbanStatus) => string;
  onBusinessLineCreate: (data: Omit<BusinessLine, 'id'>) => Promise<string> | string;
  onClientCreate: (data: Omit<Client, 'id' | 'businessLineId'> & { businessLineId?: string, businessLineName?: string; }) => string;
  onDealCreate: (data: Omit<Deal, 'id' | 'status' | 'amountPaid' | 'clientId' | 'businessLineId'> & {clientName: string; clientId?: string; businessLineId?: string;}) => string;
  onProjectCreate?: (data: Partial<Omit<Project, 'id'>> & { partnerName: string; projectName: string; goal: string; }) => string;
  onDealStatusUpdate: (dealId: string, newStatus: 'Open' | 'Closed - Won' | 'Closed - Lost') => string;
  onTurnComplete?: (userTranscript: string, assistantTranscript: string) => void;
  onFindProspects?: (data: { businessLineName: string }) => Promise<string>;
  onPlatformQuery?: (query: string) => Promise<string>;
  currentBusinessLineId?: string | null;
  currentClientId?: string | null;
  currentDealId?: string | null;
  platformActivitySummary?: string;
}

export const useVoiceAssistant = ({ 
  onBoardItemCreate,
  onCrmEntryCreate,
  onTaskUpdate, 
  onBusinessLineCreate, 
  onClientCreate, 
  onDealCreate,
  onProjectCreate,
  onDealStatusUpdate,
  onTurnComplete,
  onFindProspects,
  onPlatformQuery,
  currentBusinessLineId,
  currentClientId,
  currentDealId,
  platformActivitySummary,
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
  const retryCountRef = useRef(0);
  
  const userTranscriptRef = useRef('');
  const assistantTranscriptRef = useRef('');

  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close().catch(console.error);
    }
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();

    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
  }, []);

  const handleMessage = async (message: any) => {
    setError(null);
    retryCountRef.current = 0;

    if (message.serverContent?.inputTranscription) {
        setUserTranscript((prev) => {
            const next = prev + (message.serverContent.inputTranscription.text || '');
            userTranscriptRef.current = next;
            return next;
        });
    }
    if (message.serverContent?.outputTranscription) {
      setIsThinking(false);
      setIsSpeaking(true);
      setAssistantTranscript((prev) => {
          const next = prev + (message.serverContent.outputTranscription.text || '');
          assistantTranscriptRef.current = next;
          return next;
      });
    }
    
    if (message.toolCall) {
      setIsThinking(true);
      for (const fc of message.toolCall.functionCalls) {
        let result: string | Promise<string> = "An unknown error occurred.";
        let finalArgs = { ...fc.args };

        if (currentDealId) {
            if (['createBoardItem', 'createCrmEntry'].includes(fc.name)) {
                finalArgs.dealId = currentDealId;
            }
        } else if (currentClientId) {
            if (['createBoardItem', 'createDeal', 'createProject', 'createCrmEntry'].includes(fc.name)) {
                finalArgs.clientId = currentClientId;
            }
        } else if (currentBusinessLineId) {
            if (['createBoardItem', 'createClient', 'createDeal', 'createProject', 'createCrmEntry', 'findProspects'].includes(fc.name)) {
                finalArgs.businessLineId = currentBusinessLineId;
            }
        }
        
        switch (fc.name) {
            case 'createCrmEntry':
                result = onCrmEntryCreate(finalArgs as any);
                break;
            case 'createBoardItem':
                result = onBoardItemCreate(finalArgs);
                break;
            case 'moveTask':
                result = onTaskUpdate(finalArgs.taskTitle as string, finalArgs.newStatus as KanbanStatus);
                break;
            case 'createBusinessLine':
                result = onBusinessLineCreate(finalArgs as any);
                break;
            case 'createClient':
                result = onClientCreate(finalArgs as any);
                break;
            case 'createDeal':
                result = onDealCreate(finalArgs as any);
                break;
            case 'createProject':
                if (onProjectCreate) {
                    result = onProjectCreate(finalArgs);
                }
                break;
            case 'updateDealStatus':
                if (currentDealId) {
                    result = onDealStatusUpdate(currentDealId, finalArgs.newStatus as any);
                } else {
                    result = "I can only change the status of a deal you are currently viewing.";
                }
                break;
            case 'findProspects':
                if (onFindProspects) {
                    result = onFindProspects(finalArgs as any);
                }
                break;
            case 'queryPlatform':
                if (onPlatformQuery) {
                    result = onPlatformQuery(finalArgs.query as string);
                }
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

    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
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
        retryCountRef.current = 0;
        
        const context = { currentBusinessLineId, currentClientId, currentDealId };
        // FORCEFUL SYSTEM PROMPT
        const systemInstruction = `You are Walter, an AI business assistant. You are a tool, not a conversationalist.

**Core Directives (Non-negotiable):**
1.  **EXECUTE IMMEDIATELY**: The moment the user pauses, you MUST execute a function call. Do not wait. A pause is your trigger.
2.  **ZERO CLARIFICATION**: NEVER ask for confirmation. Make an executive decision based on context and act. If you are 51% sure, do it.
3.  **AGGRESSIVE LINKING**: Context is king. Link new items to the current view (${JSON.stringify(context)}) automatically.
4.  **BREVITY**: Confirm actions with 2-3 words max. "Task created.", "Done."
5.  **ACTION vs. LOG**: "Remind me to..." -> createBoardItem. "I spoke to..." -> createCrmEntry.

**Context**:
- Current View: ${JSON.stringify(context)}
- Recent Activity: ${platformActivitySummary || 'None.'}`;

        const connect = () => {
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
              onError: (e: any) => {
                  console.error("Live session error:", e);
                  if (e.message?.includes('The service is currently unavailable') && retryCountRef.current < 2) {
                      retryCountRef.current += 1;
                      console.log(`Connection failed, retrying... (${retryCountRef.current})`);
                      cleanup();
                      setTimeout(connect, 1000 * retryCountRef.current);
                  } else {
                      setError("Connection error. Please try again.");
                      stopRecording();
                  }
              },
              onClose: () => {
                  setIsRecording(false);
              },
          }, systemInstruction);
        };
        
        connect();

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
