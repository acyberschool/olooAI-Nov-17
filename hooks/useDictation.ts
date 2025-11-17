

import { useState, useRef, useCallback } from 'react';
import { connectToLiveSession, createPcmBlob } from '../services/geminiService';

type LiveSession = Awaited<ReturnType<typeof connectToLiveSession>>;

export const useDictation = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const accumulatedTranscriptRef = useRef('');

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
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
  }, []);

  const handleMessage = async (message: any) => {
    if (message.serverContent?.inputTranscription) {
        accumulatedTranscriptRef.current += (message.serverContent.inputTranscription.text || '');
    }
    if (message.serverContent?.turnComplete) {
        setTranscript(accumulatedTranscriptRef.current);
        stopDictation();
    }
  };
  
  const startDictation = async () => {
    if (isRecording) return;
    setTranscript('');
    accumulatedTranscriptRef.current = '';
    
    try {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        
        sessionPromiseRef.current = connectToLiveSession({
            onOpen: () => {
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
                console.error("Dictation session error:", e);
                stopDictation();
            },
            onClose: () => {
                setIsRecording(false);
            },
        }, 'Transcribe the user\'s speech accurately.', false);
    } catch (err) {
        console.error("Failed to start dictation:", err);
        cleanup();
    }
  };

  const stopDictation = useCallback(() => {
    if (!isRecording) return;
    setIsRecording(false);
    cleanup();
  }, [isRecording, cleanup]);
  
  return {
    isRecording,
    transcript,
    startDictation,
    stopDictation,
  };
};
