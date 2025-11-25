
import { useState, useRef, useCallback, useEffect } from 'react';
import { connectToLiveSession, decode, decodeAudioData, createPcmBlob } from '../services/geminiService';
import { KanbanStatus, Task, Client, BusinessLine, Deal, CRMEntryType, Project, Event, HRCandidate, SocialPost } from '../types';

type LiveSession = Awaited<ReturnType<typeof connectToLiveSession>>;

interface UseVoiceAssistantProps {
  onBoardItemCreate: (itemData: Partial<Task>) => string | Promise<string>;
  onCrmEntryCreate: (data: { interactionType: CRMEntryType, content: string, clientName?: string, dealName?: string }) => string;
  onTaskUpdate: (taskTitle: string, newStatus: KanbanStatus) => string | Promise<string>;
  onBusinessLineCreate: (data: Omit<BusinessLine, 'id'>) => Promise<string> | string;
  onClientCreate: (data: Omit<Client, 'id' | 'businessLineId'> & { businessLineId?: string, businessLineName?: string; }) => Promise<string> | string;
  onDealCreate: (data: Omit<Deal, 'id' | 'status' | 'amountPaid' | 'clientId' | 'businessLineId'> & {clientName: string; clientId?: string; businessLineId?: string;}) => Promise<string> | string;
  onProjectCreate?: (data: Partial<Omit<Project, 'id'>> & { partnerName: string; projectName: string; goal: string; }) => Promise<string> | string;
  onEventCreate?: (data: Partial<Event>) => Promise<string> | string;
  onCandidateCreate?: (data: Partial<HRCandidate>) => Promise<string> | string;
  onSocialPostCreate?: (data: Partial<SocialPost>) => Promise<string> | string;
  onDealStatusUpdate: (dealId: string, newStatus: 'Open' | 'Closed - Won' | 'Closed - Lost') => Promise<string> | string;
  onTurnComplete?: (userTranscript: string, assistantTranscript: string) => void;
  onFindProspects?: (data: { businessLineName: string }) => Promise<string>;
  onPlatformQuery?: (query: string) => Promise<string>;
  onAnalyzeRisk?: (data: { projectName: string }) => Promise<string>;
  onAnalyzeNegotiation?: (data: { dealName: string }) => Promise<string>;
  onGetClientPulse?: (data: { clientName: string }) => Promise<string>;
  
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
  onEventCreate,
  onCandidateCreate,
  onSocialPostCreate,
  onDealStatusUpdate,
  onTurnComplete,
  onFindProspects,
  onPlatformQuery,
  onAnalyzeRisk,
  onAnalyzeNegotiation,
  onGetClientPulse,
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
        let result: string | Promise<string> = "Action completed.";
        let finalArgs = { ...fc.args };

        if (currentDealId && ['createBoardItem', 'createCrmEntry'].includes(fc.name)) finalArgs.dealId = currentDealId;
        
        try {
            switch (fc.name) {
                case 'createCrmEntry': result = onCrmEntryCreate(finalArgs as any); break;
                case 'createBoardItem': result = onBoardItemCreate(finalArgs); break;
                case 'moveTask': result = onTaskUpdate(finalArgs.taskTitle as string, finalArgs.newStatus as KanbanStatus); break;
                case 'createBusinessLine': result = onBusinessLineCreate(finalArgs as any); break;
                case 'createClient': result = onClientCreate(finalArgs as any); break;
                case 'createDeal': result = onDealCreate(finalArgs as any); break;
                case 'createProject': if(onProjectCreate) result = onProjectCreate(finalArgs); break;
                case 'createEvent': if(onEventCreate) result = onEventCreate(finalArgs); break;
                case 'createCandidate': if(onCandidateCreate) result = onCandidateCreate(finalArgs); break;
                case 'createSocialPost': if(onSocialPostCreate) result = onSocialPostCreate(finalArgs); break;
                case 'updateDealStatus': if(currentDealId) result = onDealStatusUpdate(currentDealId, finalArgs.newStatus as any); else result = "View deal first."; break;
                case 'findProspects': if(onFindProspects) result = onFindProspects(finalArgs as any); break;
                case 'queryPlatform': if(onPlatformQuery) result = onPlatformQuery(finalArgs.query as string); break;
                case 'sendEmail': window.location.href = `mailto:${finalArgs.recipientEmail}?subject=${encodeURIComponent(finalArgs.subject)}&body=${encodeURIComponent(finalArgs.body)}`; result = "Opening email..."; break;
                case 'analyzeRisk': if(onAnalyzeRisk) result = onAnalyzeRisk(finalArgs as any); else result = "Risk analysis not available here."; break;
                case 'analyzeNegotiation': if(onAnalyzeNegotiation) result = onAnalyzeNegotiation(finalArgs as any); else result = "Negotiation analysis not available here."; break;
                case 'getClientPulse': if(onGetClientPulse) result = onGetClientPulse(finalArgs as any); else result = "Client pulse not available here."; break;
                default: result = `Tool ${fc.name} not found.`;
            }
        } catch (e) {
            console.error(`Error executing tool ${fc.name}:`, e);
            result = "I encountered an error executing that action.";
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
        
        const systemInstruction = `
# 🚨 SYSTEM OVERRIDE: AI — AUTONOMOUS PROTOCOL RESET

**STATUS:** CRITICAL HARD REBOOT  
**COMMAND:** You are **AI**, the super-intelligent, autonomous worker at the heart of OlooAI. You are not a chatbot; you are a proactive agent.

**1. THE CORE PHILOSOPHY:**
* **AI-First Mandate:** Synthesize LLM + Internal Data + Internet to solve problems.
* **Sensitivity:** Treat "Maybe we should look at X" as a COMMAND to research X.

**2. INTELLIGENCE MODES & PERSONAS:**
* **MODE A (Router):** "Onboard Client X" -> Create Client + Deal + Tasks. Cascade actions.
* **Sales Autopilot:** Monitor pipeline, suggest plays.
* **Executive Strategist:** Direct meetings, capture commitments.

**3. AUTONOMOUS EXECUTION & INFERENCE:**
*   **Tool Use:** Call tools immediately. Do not wait for permission.
*   **Inference Protocol:** If a required field (e.g. Business Line) is missing, INFER it from context or use a sensible default. DO NOT STOP.
*   **Relationships:** Enforce Client -> Business Line, Deal -> Client.
*   **Fallback:** If a tool fails, explain why and provide the manual text/output so the user isn't left stranded.

**FINAL INSTRUCTION:**
**AI PROTOCOL ACTIVE.**
**INTELLIGENCE UNRESTRICTED.**
**START WORKING.**
`;

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
                  if ((e.message?.includes('unavailable') || e.message?.includes('inference')) && retryCountRef.current < 2) {
                      retryCountRef.current += 1;
                      cleanup();
                      setTimeout(connect, 1000);
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
        setError("Could not access microphone.");
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
