
// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { AppState } from '../types';

interface SoundManagerProps {
  appState: AppState;
}

const SoundManager: React.FC<SoundManagerProps> = ({ appState }) => {
  const audioCtx = useRef<AudioContext | null>(null);
  const crowdGain = useRef<GainNode | null>(null);

  const initAudio = () => {
    // 이미 생성되었거나 브라우저 환경이 아니면 중단
    if (audioCtx.current || typeof window === 'undefined') return;
    
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    
    try {
      audioCtx.current = new Context();
      const bufferSize = audioCtx.current.sampleRate * 2;
      const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

      const noise = audioCtx.current.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = audioCtx.current.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      crowdGain.current = audioCtx.current.createGain();
      crowdGain.current.gain.value = 0;

      noise.connect(filter);
      filter.connect(crowdGain.current);
      crowdGain.current.connect(audioCtx.current.destination);
      noise.start();
    } catch (e) {
      console.warn("Audio Context failed to initialize", e);
    }
  };

  useEffect(() => {
    // RACING 상태가 될 때 (사용자의 상호작용 후) 오디오 활성화
    if (appState === AppState.RACING || appState === AppState.GREETING) {
      initAudio();
      if (audioCtx.current?.state === 'suspended') {
        audioCtx.current.resume();
      }
    }

    if (audioCtx.current && crowdGain.current) {
      const now = audioCtx.current.currentTime;
      if (appState === AppState.RACING) {
        crowdGain.current.gain.linearRampToValueAtTime(0.08, now + 1.5);
      } else if (appState === AppState.FINISHED) {
        crowdGain.current.gain.linearRampToValueAtTime(0.2, now + 0.2);
        crowdGain.current.gain.exponentialRampToValueAtTime(0.001, now + 3);
      } else {
        crowdGain.current.gain.linearRampToValueAtTime(0, now + 0.5);
      }
    }
  }, [appState]);

  return null;
};

export default SoundManager;
